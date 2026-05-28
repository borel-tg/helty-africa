import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByModule = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    return ctx.db
      .query("moduleResources")
      .withIndex("by_module_order", (q) => q.eq("moduleId", moduleId))
      .collect();
  },
});

export const create = mutation({
  args: {
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("link"),
      v.literal("video"),
      v.literal("pdf"),
      v.literal("ppt"),
      v.literal("image")
    ),
    url: v.string(),
    fileName: v.optional(v.string()),
    downloadable: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("moduleResources")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .collect();
    const now = Date.now();
    return ctx.db.insert("moduleResources", {
      ...args,
      order: existing.length,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    resourceId: v.id("moduleResources"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("link"),
        v.literal("video"),
        v.literal("pdf"),
        v.literal("ppt"),
        v.literal("image")
      )
    ),
    url: v.optional(v.string()),
    fileName: v.optional(v.string()),
    downloadable: v.optional(v.boolean()),
  },
  handler: async (ctx, { resourceId, ...updates }) => {
    await ctx.db.patch(resourceId, { ...updates, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { resourceId: v.id("moduleResources") },
  handler: async (ctx, { resourceId }) => {
    await ctx.db.delete(resourceId);
  },
});

