import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByModule = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    return ctx.db
      .query("lessons")
      .withIndex("by_module_order", (q) => q.eq("moduleId", moduleId))
      .collect();
  },
});

export const getById = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, { lessonId }) => {
    return ctx.db.get(lessonId);
  },
});

export const create = mutation({
  args: {
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("text"), v.literal("video"), v.literal("document")),
    content: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    videoId: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    fileType: v.optional(v.union(v.literal("pdf"), v.literal("ppt"))),
    fileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("lessons")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .collect();
    const now = Date.now();
    return ctx.db.insert("lessons", {
      ...args,
      order: existing.length,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    lessonId: v.id("lessons"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    videoId: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    fileType: v.optional(v.union(v.literal("pdf"), v.literal("ppt"))),
    fileName: v.optional(v.string()),
  },
  handler: async (ctx, { lessonId, ...updates }) => {
    await ctx.db.patch(lessonId, { ...updates, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, { lessonId }) => {
    await ctx.db.delete(lessonId);
  },
});

export const reorder = mutation({
  args: { orderedIds: v.array(v.id("lessons")) },
  handler: async (ctx, { orderedIds }) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i], { order: i });
    }
  },
});
