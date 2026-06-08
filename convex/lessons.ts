import {
  adminMutation,
  authedQuery,
} from "./lib/functions";
import { v } from "convex/values";
import { assertOrgAdmin } from "./lib/requireAuth";

export const listByModule = authedQuery({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    const user = ctx.user;
    const mod = await ctx.db.get(moduleId);
    if (!mod || mod.organizationId !== user.organizationId) {
      throw new Error("Unauthorized");
    }
    return ctx.db
      .query("lessons")
      .withIndex("by_module_order", (q) => q.eq("moduleId", moduleId))
      .collect();
  },
});

export const getById = authedQuery({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, { lessonId }) => {
    const user = ctx.user;
    const lesson = await ctx.db.get(lessonId);
    if (!lesson) return null;
    const mod = await ctx.db.get(lesson.moduleId);
    if (!mod || mod.organizationId !== user.organizationId) {
      return null;
    }
    return lesson;
  },
});

export const create = adminMutation({
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
    assertOrgAdmin(ctx.user, args.organizationId);
    const mod = await ctx.db.get(args.moduleId);
    if (!mod || mod.organizationId !== args.organizationId) {
      throw new Error("Module not found");
    }
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

export const update = adminMutation({
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
    const lesson = await ctx.db.get(lessonId);
    if (!lesson) throw new Error("Lesson not found");
    const mod = await ctx.db.get(lesson.moduleId);
    if (!mod) throw new Error("Module not found");
    assertOrgAdmin(ctx.user, mod.organizationId);
    await ctx.db.patch(lessonId, { ...updates, updatedAt: Date.now() });
  },
});

export const remove = adminMutation({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, { lessonId }) => {
    const lesson = await ctx.db.get(lessonId);
    if (!lesson) throw new Error("Lesson not found");
    const mod = await ctx.db.get(lesson.moduleId);
    if (!mod) throw new Error("Module not found");
    assertOrgAdmin(ctx.user, mod.organizationId);
    await ctx.db.delete(lessonId);
  },
});

export const reorder = adminMutation({
  args: { orderedIds: v.array(v.id("lessons")) },
  handler: async (ctx, { orderedIds }) => {
    if (orderedIds.length === 0) return;
    const first = await ctx.db.get(orderedIds[0]);
    if (!first) throw new Error("Lesson not found");
    const mod = await ctx.db.get(first.moduleId);
    if (!mod) throw new Error("Module not found");
    assertOrgAdmin(ctx.user, mod.organizationId);
    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i], { order: i });
    }
  },
});
