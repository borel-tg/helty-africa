import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { hashPassword } from "./lib/password";
import { learnerCategoryKeyValidator } from "./lib/learnerCategories";

// ── Queries ────────────────────────────────────────────────────────────────

export const getMe = query({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, { tokenIdentifier }) => {
    return ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();
  },
});

export const listByOrg = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    return ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();
  },
});

export const listLearnersByLead = query({
  args: { leadId: v.id("users") },
  handler: async (ctx, { leadId }) => {
    return ctx.db
      .query("users")
      .withIndex("by_lead", (q) => q.eq("leadId", leadId))
      .collect();
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db.get(userId);
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = email.trim().toLowerCase();
    const byIndex = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();
    if (byIndex) return byIndex;

    // Fallback: legacy rows may have non-normalized email casing
    const all = await ctx.db.query("users").collect();
    return all.find((u) => u.email?.toLowerCase() === normalized) ?? null;
  },
});

// ── Mutations ──────────────────────────────────────────────────────────────

const userRoleValidator = v.union(
  v.literal("super_admin"),
  v.literal("admin"),
  v.literal("lead"),
  v.literal("learner")
);

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: userRoleValidator,
    passwordHash: v.optional(v.string()),
    password: v.optional(v.string()),
    mustChangePassword: v.optional(v.boolean()),
    tokenIdentifier: v.optional(v.string()),
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
    return ctx.db.insert("users", {
      ...rest,
      passwordHash,
      status: "active",
      createdAt: now,
    });
  },
});

/** Admin manual create — inserts user and emails login link (requires email). */
export const createManualAccount = mutation({
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
    const normalizedEmail = args.email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error("L'adresse e-mail est obligatoire pour envoyer le lien de connexion.");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
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

export const update = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("super_admin"),
        v.literal("admin"),
        v.literal("lead"),
        v.literal("learner")
      )
    ),
    leadId: v.optional(v.id("users")),
    learnerCategoryKey: v.optional(learnerCategoryKeyValidator),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    passwordHash: v.optional(v.string()),
    mustChangePassword: v.optional(v.boolean()),
  },
  handler: async (ctx, { userId, ...updates }) => {
    await ctx.db.patch(userId, updates);
  },
});

export const deactivate = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, { status: "inactive" });
  },
});

export const reactivate = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, { status: "active" });
  },
});

export const hardDelete = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.delete(userId);
  },
});

export const assignLead = mutation({
  args: { learnerId: v.id("users"), leadId: v.optional(v.id("users")) },
  handler: async (ctx, { learnerId, leadId }) => {
    await ctx.db.patch(learnerId, { leadId });
  },
});

export const recordLogin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, { lastLoginAt: Date.now() });
  },
});
