import {
  adminMutation,
  authedMutation,
  authedQuery,
} from "./lib/functions";
import { v } from "convex/values";
import {
  assertOrgMember,
  loadOrgUserAccess,
} from "./lib/requireAuth";

export const getLessonProgress = authedQuery({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, { lessonId }) => {
    const user = ctx.user;
    return ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", user._id).eq("lessonId", lessonId)
      )
      .unique();
  },
});

export const getModuleProgress = authedQuery({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    const user = ctx.user;
    return ctx.db
      .query("lessonProgress")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", user._id).eq("moduleId", moduleId)
      )
      .collect();
  },
});

export const getAllProgressForUser = authedQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const user = ctx.user;
    assertOrgMember(user, organizationId);
    return ctx.db
      .query("lessonProgress")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();
  },
});

export const markAccessed = authedMutation({
  args: {
    lessonId: v.id("lessons"),
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const user = ctx.user;
    assertOrgMember(user, args.organizationId);
    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", user._id).eq("lessonId", args.lessonId)
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { lastAccessedAt: now });
    } else {
      await ctx.db.insert("lessonProgress", {
        userId: user._id,
        lessonId: args.lessonId,
        moduleId: args.moduleId,
        organizationId: args.organizationId,
        completed: false,
        firstAccessedAt: now,
        lastAccessedAt: now,
        timeSpentSeconds: 0,
      });
    }
  },
});

export const markCompleted = authedMutation({
  args: {
    lessonId: v.id("lessons"),
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const user = ctx.user;
    assertOrgMember(user, args.organizationId);
    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", user._id).eq("lessonId", args.lessonId)
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        completed: true,
        completedAt: existing.completedAt ?? now,
        lastAccessedAt: now,
      });
    } else {
      await ctx.db.insert("lessonProgress", {
        userId: user._id,
        lessonId: args.lessonId,
        moduleId: args.moduleId,
        organizationId: args.organizationId,
        completed: true,
        completedAt: now,
        firstAccessedAt: now,
        lastAccessedAt: now,
        timeSpentSeconds: 0,
      });
    }
  },
});

export const addTimeSpent = authedMutation({
  args: {
    lessonId: v.id("lessons"),
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    seconds: v.number(),
  },
  handler: async (ctx, { seconds, ...args }) => {
    const user = ctx.user;
    assertOrgMember(user, args.organizationId);
    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", user._id).eq("lessonId", args.lessonId)
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

export const resetModuleProgress = adminMutation({
  args: {
    targetUserId: v.id("users"),
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const { target } = await loadOrgUserAccess(ctx, ctx.user, args.targetUserId);
    const mod = await ctx.db.get(args.moduleId);
    if (!mod || mod.organizationId !== target.organizationId) {
      throw new Error("Module not found");
    }

    const rows = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", target._id).eq("moduleId", args.moduleId)
      )
      .collect();

    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
  },
});
