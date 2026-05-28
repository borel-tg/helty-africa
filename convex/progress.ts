import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getLessonProgress = query({
  args: { userId: v.id("users"), lessonId: v.id("lessons") },
  handler: async (ctx, { userId, lessonId }) => {
    return ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", userId).eq("lessonId", lessonId)
      )
      .unique();
  },
});

export const getModuleProgress = query({
  args: { userId: v.id("users"), moduleId: v.id("modules") },
  handler: async (ctx, { userId, moduleId }) => {
    return ctx.db
      .query("lessonProgress")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", userId).eq("moduleId", moduleId)
      )
      .collect();
  },
});

export const getAllProgressForUser = query({
  args: { userId: v.id("users"), organizationId: v.id("organizations") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("lessonProgress")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
  },
});

export const markAccessed = mutation({
  args: {
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId)
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { lastAccessedAt: now });
    } else {
      await ctx.db.insert("lessonProgress", {
        ...args,
        completed: false,
        firstAccessedAt: now,
        lastAccessedAt: now,
        timeSpentSeconds: 0,
      });
    }
  },
});

export const markCompleted = mutation({
  args: {
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId)
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { completed: true, lastAccessedAt: now });
    } else {
      await ctx.db.insert("lessonProgress", {
        ...args,
        completed: true,
        firstAccessedAt: now,
        lastAccessedAt: now,
        timeSpentSeconds: 0,
      });
    }
  },
});

export const addTimeSpent = mutation({
  args: {
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    seconds: v.number(),
  },
  handler: async (ctx, { seconds, ...args }) => {
    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        timeSpentSeconds: existing.timeSpentSeconds + seconds,
        lastAccessedAt: Date.now(),
      });
    }
  },
});

export const resetModuleProgress = mutation({
  args: {
    userId: v.id("users"),
    moduleId: v.id("modules"),
  },
  handler: async (ctx, { userId, moduleId }) => {
    const records = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", userId).eq("moduleId", moduleId)
      )
      .collect();
    for (const record of records) {
      await ctx.db.delete(record._id);
    }
  },
});
