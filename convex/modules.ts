import {
  adminMutation,
  adminQuery,
  authedQuery,
} from "./lib/functions";
import { v } from "convex/values";
import { assertOrgAdmin, assertOrgMember } from "./lib/requireAuth";

export const list = adminQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    assertOrgAdmin(ctx.user, organizationId);
    const modules = await ctx.db
      .query("modules")
      .withIndex("by_org_order", (q) => q.eq("organizationId", organizationId))
      .collect();

    return Promise.all(
      modules.map(async (mod) => {
        const lessons = await ctx.db
          .query("lessons")
          .withIndex("by_module", (q) => q.eq("moduleId", mod._id))
          .collect();
        const programLink = await ctx.db
          .query("trainingProgramModules")
          .withIndex("by_module", (q) => q.eq("moduleId", mod._id))
          .unique();
        let assignedProgramTitle: string | null = null;
        if (programLink) {
          const program = await ctx.db.get(programLink.programId);
          assignedProgramTitle = program?.title ?? null;
        }
        return {
          ...mod,
          lessonCount: lessons.length,
          assignedProgramId: programLink?.programId ?? null,
          assignedProgramTitle,
        };
      })
    );
  },
});

export const listPublished = authedQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    assertOrgMember(ctx.user, organizationId);
    const modules = await ctx.db
      .query("modules")
      .withIndex("by_org_order", (q) => q.eq("organizationId", organizationId))
      .collect();
    return modules.filter((m) => m.status === "published");
  },
});

export const getById = authedQuery({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    const user = ctx.user;
    const mod = await ctx.db.get(moduleId);
    if (!mod || mod.organizationId !== user.organizationId) {
      return null;
    }
    return mod;
  },
});

export const create = adminMutation({
  args: {
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.string(),
    thumbnailUrl: v.optional(v.string()),
    passingScore: v.number(),
    maxRetakes: v.union(v.number(), v.literal("unlimited")),
  },
  handler: async (ctx, args) => {
    const user = ctx.user;
    assertOrgAdmin(user, args.organizationId);
    const existing = await ctx.db
      .query("modules")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    const now = Date.now();
    return ctx.db.insert("modules", {
      ...args,
      createdBy: user._id,
      status: "draft",
      order: existing.length,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = adminMutation({
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
    const mod = await ctx.db.get(moduleId);
    if (!mod) throw new Error("Module not found");
    assertOrgAdmin(ctx.user, mod.organizationId);
    await ctx.db.patch(moduleId, { ...updates, updatedAt: Date.now() });
  },
});

export const remove = adminMutation({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    const mod = await ctx.db.get(moduleId);
    if (!mod) throw new Error("Module not found");
    assertOrgAdmin(ctx.user, mod.organizationId);

    const programLinks = await ctx.db
      .query("trainingProgramModules")
      .withIndex("by_module", (q) => q.eq("moduleId", moduleId))
      .collect();
    for (const link of programLinks) {
      await ctx.db.delete(link._id);
    }

    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_module", (q) => q.eq("moduleId", moduleId))
      .collect();
    for (const lesson of lessons) {
      await ctx.db.delete(lesson._id);
    }

    const resources = await ctx.db
      .query("moduleResources")
      .withIndex("by_module", (q) => q.eq("moduleId", moduleId))
      .collect();
    for (const resource of resources) {
      await ctx.db.delete(resource._id);
    }

    const questions = await ctx.db
      .query("examQuestions")
      .withIndex("by_module", (q) => q.eq("moduleId", moduleId))
      .collect();
    for (const question of questions) {
      await ctx.db.delete(question._id);
    }

    const examSettings = await ctx.db
      .query("examSettings")
      .withIndex("by_module", (q) => q.eq("moduleId", moduleId))
      .unique();
    if (examSettings) {
      await ctx.db.delete(examSettings._id);
    }

    await ctx.db.delete(moduleId);
  },
});

export const reorder = adminMutation({
  args: {
    organizationId: v.id("organizations"),
    orderedIds: v.array(v.id("modules")),
  },
  handler: async (ctx, { organizationId, orderedIds }) => {
    assertOrgAdmin(ctx.user, organizationId);
    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i], { order: i });
    }
  },
});
