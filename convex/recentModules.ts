import {
  authedMutation,
  authedQuery,
} from "./lib/functions";
import { v } from "convex/values";

async function getProgramModuleLinks(ctx: { db: any }, programId: any) {
  return ctx.db
    .query("trainingProgramModules")
    .withIndex("by_program_order", (q: any) => q.eq("programId", programId))
    .collect();
}

/** Module belongs to an enrolled program for this learner. */
export const findEnrolledProgramForModule = authedQuery({
  args: {
    moduleId: v.id("modules"),
  },
  handler: async (ctx, { moduleId }) => {
    const user = ctx.user;
    const enrollments = await ctx.db
      .query("programEnrollments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const enrollment of enrollments) {
      const links = await getProgramModuleLinks(ctx, enrollment.programId);
      const inProgram = links.some((l: { moduleId: string }) => l.moduleId === moduleId);
      if (!inProgram) continue;

      const program = await ctx.db.get(enrollment.programId);
      const mod = await ctx.db.get(moduleId);
      if (!program || !mod || mod.status !== "published") continue;

      return {
        program: {
          _id: program._id,
          title: program.title,
          description: program.description,
          accessMode: program.accessMode,
        },
        module: {
          _id: mod._id,
          title: mod.title,
          description: mod.description,
        },
      };
    }

    return null;
  },
});

export const recordAccess = authedMutation({
  args: {
    moduleId: v.id("modules"),
    programId: v.id("trainingPrograms"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const user = ctx.user;
    if (user.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    const enrollment = await ctx.db
      .query("programEnrollments")
      .withIndex("by_user_program", (q) =>
        q.eq("userId", user._id).eq("programId", args.programId)
      )
      .unique();
    if (!enrollment) return;

    const links = await getProgramModuleLinks(ctx, args.programId);
    const inProgram = links.some(
      (l: { moduleId: string }) => l.moduleId === args.moduleId
    );
    if (!inProgram) return;

    const now = Date.now();
    const existing = await ctx.db
      .query("learnerModuleAccess")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", user._id).eq("moduleId", args.moduleId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastAccessedAt: now,
        programId: args.programId,
      });
      return existing._id;
    }

    return ctx.db.insert("learnerModuleAccess", {
      userId: user._id,
      moduleId: args.moduleId,
      programId: args.programId,
      organizationId: args.organizationId,
      lastAccessedAt: now,
    });
  },
});

/** Recently opened modules in enrolled programs (fresh titles from DB). */
export const listForLearner = authedQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 3 }) => {
    const user = ctx.user;
    const enrollments = await ctx.db
      .query("programEnrollments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const enrolledProgramIds = new Set(
      enrollments.map((e) => e.programId as string)
    );
    if (enrolledProgramIds.size === 0) return [];

    const accessRows = await ctx.db
      .query("learnerModuleAccess")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const results = [];
    for (const row of accessRows) {
      if (!enrolledProgramIds.has(row.programId as string)) continue;

      const program = await ctx.db.get(row.programId);
      const mod = await ctx.db.get(row.moduleId);
      if (!program || !mod || mod.status !== "published") continue;
      if (program.status !== "published") continue;

      results.push({
        moduleId: mod._id,
        programId: program._id,
        programTitle: program.title,
        moduleTitle: mod.title,
        accessedAt: row.lastAccessedAt,
      });
    }

    results.sort((a, b) => b.accessedAt - a.accessedAt);
    return results.slice(0, limit);
  },
});
