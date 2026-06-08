import {
  adminMutation,
  adminQuery,
  authedQuery,
  leadOrAdminQuery,
} from "./lib/functions";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { hashPassword } from "./lib/password";
import { learnerCategoryKeyValidator } from "./lib/learnerCategories";
import { ensurePasswordAccount } from "./lib/passwordAccount";
import {
  assertOrgAdmin,
  loadOrgUserAccess,
} from "./lib/requireAuth";

// ── Queries ────────────────────────────────────────────────────────────────

export const current = authedQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.user;
  },
});

export const listByOrg = adminQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    assertOrgAdmin(ctx.user, organizationId);
    return ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();
  },
});

export const listLearnersByLead = leadOrAdminQuery({
  args: { leadId: v.id("users") },
  handler: async (ctx, { leadId }) => {
    const user = ctx.user;
    const lead = await ctx.db.get(leadId);
    if (!lead || lead.organizationId !== user.organizationId) {
      throw new Error("Unauthorized");
    }
    if (user.role === "lead" && user._id !== leadId) {
      throw new Error("Unauthorized");
    }
    return ctx.db
      .query("users")
      .withIndex("by_lead", (q) => q.eq("leadId", leadId))
      .collect();
  },
});

export const getById = authedQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = ctx.user;
    const target = await ctx.db.get(userId);
    if (!target || target.organizationId !== user.organizationId) {
      return null;
    }
    if (user._id === userId) return target;
    if (user.role === "admin" || user.role === "super_admin") return target;
    if (user.role === "lead" && target.leadId === user._id) return target;
    return null;
  },
});

// ── Mutations ──────────────────────────────────────────────────────────────

const userRoleValidator = v.union(
  v.literal("super_admin"),
  v.literal("admin"),
  v.literal("lead"),
  v.literal("learner")
);

/** Seed only — not exposed to clients after auth hardening. */
export const create = adminMutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: userRoleValidator,
    passwordHash: v.optional(v.string()),
    password: v.optional(v.string()),
    mustChangePassword: v.optional(v.boolean()),
    leadId: v.optional(v.id("users")),
    learnerCategoryKey: v.optional(learnerCategoryKeyValidator),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const { password, passwordHash: providedHash, ...rest } = args;
    let passwordHash = providedHash;
    if (password && !passwordHash) {
      passwordHash = await hashPassword(password);
    }
    const userId = await ctx.db.insert("users", {
      ...rest,
      passwordHash,
      status: "active",
      createdAt: now,
    });
    if (rest.email && passwordHash) {
      await ensurePasswordAccount(ctx, userId, rest.email, passwordHash);
    }
    return userId;
  },
});

export const createManualAccount = adminMutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: userRoleValidator,
    password: v.string(),
    learnerCategoryKey: v.optional(learnerCategoryKeyValidator),
    leadId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    assertOrgAdmin(ctx.user, args.organizationId);

    const normalizedEmail = args.email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error("L'adresse e-mail est obligatoire pour envoyer le lien de connexion.");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();
    if (existing) {
      throw new Error("Un compte existe déjà avec cette adresse e-mail.");
    }

    const passwordHash = await hashPassword(args.password);
    const now = Date.now();

    const userId = await ctx.db.insert("users", {
      organizationId: args.organizationId,
      name: args.name.trim(),
      email: normalizedEmail,
      phone: args.phone,
      role: args.role,
      learnerCategoryKey:
        args.role === "learner" ? args.learnerCategoryKey : undefined,
      leadId: args.leadId,
      passwordHash,
      mustChangePassword: true,
      status: "active",
      createdAt: now,
    });

    await ensurePasswordAccount(ctx, userId, normalizedEmail, passwordHash);

    const org = await ctx.db.get(args.organizationId);
    await ctx.scheduler.runAfter(0, internal.emails.sendManualAccountEmail, {
      to: normalizedEmail,
      name: args.name.trim(),
      role: args.role,
      organizationName: org?.name,
    });

    return { userId, email: normalizedEmail };
  },
});

export const update = adminMutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(userRoleValidator),
    leadId: v.optional(v.id("users")),
    learnerCategoryKey: v.optional(learnerCategoryKeyValidator),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    passwordHash: v.optional(v.string()),
    mustChangePassword: v.optional(v.boolean()),
  },
  handler: async (ctx, { userId, ...updates }) => {
    await loadOrgUserAccess(ctx, ctx.user, userId);
    await ctx.db.patch(userId, updates);
  },
});

export const deactivate = adminMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await loadOrgUserAccess(ctx, ctx.user, userId);
    await ctx.db.patch(userId, { status: "inactive" });
  },
});

export const reactivate = adminMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await loadOrgUserAccess(ctx, ctx.user, userId);
    await ctx.db.patch(userId, { status: "active" });
  },
});

export const hardDelete = adminMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await loadOrgUserAccess(ctx, ctx.user, userId);
    await ctx.db.delete(userId);
  },
});

export const assignLead = adminMutation({
  args: { learnerId: v.id("users"), leadId: v.optional(v.id("users")) },
  handler: async (ctx, { learnerId, leadId }) => {
    const { target } = await loadOrgUserAccess(ctx, ctx.user, learnerId);
    if (target.role !== "learner") {
      throw new Error("Only learners can be assigned to a lead");
    }
    if (leadId) {
      const lead = await ctx.db.get(leadId);
      if (!lead || lead.organizationId !== target.organizationId) {
        throw new Error("Lead not found");
      }
    }
    await ctx.db.patch(learnerId, { leadId });
  },
});
