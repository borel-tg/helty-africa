import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getForUserModule = query({
  args: { userId: v.id("users"), moduleId: v.id("modules") },
  handler: async (ctx, { userId, moduleId }) => {
    return ctx.db
      .query("certificates")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", userId).eq("moduleId", moduleId)
      )
      .unique();
  },
});

export const listForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("certificates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const issue = mutation({
  args: {
    userId: v.id("users"),
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    examAttemptId: v.id("examAttempts"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    // Prevent duplicate certificates
    const existing = await ctx.db
      .query("certificates")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", args.userId).eq("moduleId", args.moduleId)
      )
      .unique();
    if (existing) return existing._id;

    return ctx.db.insert("certificates", {
      ...args,
      issuedAt: Date.now(),
    });
  },
});

// ── Certificate Templates ──────────────────────────────────────────────────

export const getTemplate = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    return ctx.db
      .query("certificateTemplates")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .unique();
  },
});

export const upsertTemplate = mutation({
  args: {
    organizationId: v.id("organizations"),
    organizationName: v.string(),
    logoUrl: v.optional(v.string()),
    signatureLine: v.optional(v.string()),
    borderColor: v.string(),
    backgroundImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("certificateTemplates")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("certificateTemplates", {
        ...args,
        updatedAt: Date.now(),
      });
    }
  },
});
