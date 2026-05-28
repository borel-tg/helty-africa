import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    return ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
  },
});

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("lead"), v.literal("learner")),
    invitedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Generate a random token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    return ctx.db.insert("invitations", {
      ...args,
      token,
      expiresAt,
      createdAt: Date.now(),
    });
  },
});

export const consume = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!invitation) throw new Error("Invitation not found");
    if (invitation.usedAt) throw new Error("Invitation already used");
    if (invitation.expiresAt < Date.now()) throw new Error("Invitation expired");

    await ctx.db.patch(invitation._id, { usedAt: Date.now() });
    return invitation;
  },
});
