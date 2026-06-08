import {
  adminMutation,
  adminQuery,
  publicMutation,
  publicQuery,
} from "./lib/functions";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { hashPassword } from "./lib/password";
import { ensurePasswordAccount } from "./lib/passwordAccount";
import {
  isLearnerCategoryKey,
  learnerCategoryKeyValidator,
} from "./lib/learnerCategories";
import { assertOrgAdmin } from "./lib/requireAuth";

export const listByOrg = adminQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    assertOrgAdmin(ctx.user, organizationId);
    const now = Date.now();
    const rows = await ctx.db
      .query("invitations")
      .filter((q) => q.eq(q.field("organizationId"), organizationId))
      .collect();

    return rows
      .map((inv) => {
        let status: "pending" | "signed_up" | "expired";
        if (inv.usedAt) status = "signed_up";
        else if (inv.expiresAt <= now) status = "expired";
        else status = "pending";

        return {
          _id: inv._id,
          email: inv.email,
          role: inv.role,
          status,
          invitedAt: inv.createdAt,
          expiresAt: inv.expiresAt,
          usedAt: inv.usedAt ?? null,
        };
      })
      .sort((a, b) => b.invitedAt - a.invitedAt);
  },
});

/** Register page — safe invitation preview (no token in response). */
export const getPublicByToken = publicQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!invitation) {
      return { status: "not_found" as const };
    }

    const org = await ctx.db.get(invitation.organizationId);
    const base = {
      email: invitation.email,
      role: invitation.role,
      organizationName: org?.name ?? "",
    };

    if (invitation.usedAt) {
      return { status: "used" as const, ...base };
    }
    if (invitation.expiresAt < Date.now()) {
      return { status: "expired" as const, ...base };
    }

    return { status: "valid" as const, ...base };
  },
});

export const getByToken = adminQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!invitation) return null;
    assertOrgAdmin(ctx.user, invitation.organizationId);
    return invitation;
  },
});

export const create = adminMutation({
  args: {
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("lead"), v.literal("learner")),
  },
  handler: async (ctx, args) => {
    const user = ctx.user;
    assertOrgAdmin(user, args.organizationId);
    const normalizedEmail = args.email.trim().toLowerCase();
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();
    if (existingUser) {
      throw new Error("Un compte existe déjà avec cette adresse e-mail.");
    }

    const token =
      Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const invitationId = await ctx.db.insert("invitations", {
      organizationId: args.organizationId,
      email: normalizedEmail,
      role: args.role,
      invitedBy: user._id,
      token,
      expiresAt,
      createdAt: Date.now(),
    });

    const org = await ctx.db.get(args.organizationId);
    await ctx.scheduler.runAfter(0, internal.emails.sendInvitationEmail, {
      to: normalizedEmail,
      token,
      role: args.role,
      organizationName: org?.name,
    });

    return invitationId;
  },
});

export const resendEmail = adminMutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, { invitationId }) => {
    const invitation = await ctx.db.get(invitationId);
    if (!invitation) throw new Error("Invitation not found");
    assertOrgAdmin(ctx.user, invitation.organizationId);
    if (invitation.usedAt) throw new Error("Invitation already used");

    const org = await ctx.db.get(invitation.organizationId);
    await ctx.scheduler.runAfter(0, internal.emails.sendInvitationEmail, {
      to: invitation.email,
      token: invitation.token,
      role: invitation.role,
      organizationName: org?.name,
    });
  },
});

export const completeRegistration = publicMutation({
  args: {
    token: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    password: v.string(),
    learnerCategoryKey: v.optional(learnerCategoryKeyValidator),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invitation) throw new Error("Invitation invalide.");
    if (invitation.usedAt) throw new Error("Cette invitation a déjà été utilisée.");
    if (invitation.expiresAt < Date.now()) {
      throw new Error("Cette invitation a expiré.");
    }

    const normalizedEmail = invitation.email.trim().toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();
    if (existing) {
      throw new Error("Un compte existe déjà avec cette adresse e-mail.");
    }

    if (invitation.role === "learner") {
      if (!args.learnerCategoryKey || !isLearnerCategoryKey(args.learnerCategoryKey)) {
        throw new Error("Veuillez sélectionner une catégorie.");
      }
    }

    const firstName = args.firstName.trim();
    const lastName = args.lastName.trim();
    if (!firstName || !lastName) {
      throw new Error("Le prénom et le nom sont obligatoires.");
    }

    const phone = args.phone.trim();
    if (!phone) throw new Error("Le numéro de téléphone est obligatoire.");

    if (args.password.length < 8) {
      throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
    }

    const passwordHash = await hashPassword(args.password);
    const now = Date.now();

    const userId = await ctx.db.insert("users", {
      organizationId: invitation.organizationId,
      name: `${firstName} ${lastName}`,
      email: normalizedEmail,
      phone,
      role: invitation.role,
      status: "active",
      learnerCategoryKey:
        invitation.role === "learner" ? args.learnerCategoryKey : undefined,
      passwordHash,
      mustChangePassword: false,
      createdAt: now,
    });

    await ensurePasswordAccount(ctx, userId, normalizedEmail, passwordHash);

    await ctx.db.patch(invitation._id, { usedAt: now });

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Échec de la création du compte.");

    const { passwordHash: _, ...safe } = user;
    return { user: safe };
  },
});

export const consume = adminMutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!invitation) throw new Error("Invitation not found");
    assertOrgAdmin(ctx.user, invitation.organizationId);
    if (invitation.usedAt) throw new Error("Invitation already used");
    if (invitation.expiresAt < Date.now()) throw new Error("Invitation expired");

    await ctx.db.patch(invitation._id, { usedAt: Date.now() });
    return invitation;
  },
});
