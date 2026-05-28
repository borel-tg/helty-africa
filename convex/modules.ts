import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    return ctx.db
      .query("modules")
      .withIndex("by_org_order", (q) => q.eq("organizationId", organizationId))
      .collect();
  },
});

export const listPublished = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const modules = await ctx.db
      .query("modules")
      .withIndex("by_org_order", (q) => q.eq("organizationId", organizationId))
      .collect();
    return modules.filter((m) => m.status === "published");
  },
});

export const getById = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    return ctx.db.get(moduleId);
  },
});

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.string(),
    thumbnailUrl: v.optional(v.string()),
    passingScore: v.number(),
    maxRetakes: v.union(v.number(), v.literal("unlimited")),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("modules")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    const now = Date.now();
    return ctx.db.insert("modules", {
      ...args,
      status: "draft",
      order: existing.length,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    moduleId: v.id("modules"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    passingScore: v.optional(v.number()),
    maxRetakes: v.optional(v.union(v.number(), v.literal("unlimited"))),
  },
  handler: async (ctx, { moduleId, ...updates }) => {
    await ctx.db.patch(moduleId, { ...updates, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    await ctx.db.delete(moduleId);
  },
});

export const reorder = mutation({
  args: {
    organizationId: v.id("organizations"),
    orderedIds: v.array(v.id("modules")),
  },
  handler: async (ctx, { orderedIds }) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i], { order: i });
    }
  },
});
