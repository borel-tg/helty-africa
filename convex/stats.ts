import {
  adminQuery,
  leadOrAdminQuery,
} from "./lib/functions";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { learnerCategoryKeyValidator } from "./lib/learnerCategories";
import {
  assertOrgAdmin,
  assertOrgMember,
  type SafeUser,
} from "./lib/requireAuth";
import {
  buildCategoryBuckets,
  getCategoryBucketKey,
  getEnrolledActiveLearners,
  getProgramPublishedModules,
  learnerProgramStatus,
  matchesCategoryFilter,
  type LearnerCategoryFilter,
} from "./lib/programStatsHelpers";

const learnerCategoryFilterValidator = v.optional(
  v.union(
    learnerCategoryKeyValidator,
    v.literal("uncategorized")
  )
);

async function requireStaffAccessToLearner(
  ctx: QueryCtx,
  actor: SafeUser,
  organizationId: Id<"organizations">,
  userId: Id<"users">
) {
  assertOrgMember(actor, organizationId);
  const target = await ctx.db.get(userId);
  if (!target || target.organizationId !== organizationId) {
    throw new Error("User not found");
  }
  if (actor.role === "lead" && target.leadId !== actor._id) {
    throw new Error("Unauthorized");
  }
  return { actor, target };
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export const getOrgDashboard = adminQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    assertOrgAdmin(ctx.user, organizationId);
    const users = await ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();

    const activeLearners = users.filter(
      (u) => u.role === "learner" && u.status === "active"
    );

    const modules = await ctx.db
      .query("modules")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();

    const publishedModules = modules.filter((m) => m.status === "published");

    const allProgress = await ctx.db.query("lessonProgress").collect();
    const orgProgress = allProgress.filter(
      (p) => p.organizationId === organizationId
    );

    const allAttempts = await ctx.db.query("examAttempts").collect();
    const orgAttempts = allAttempts.filter(
      (a) => a.organizationId === organizationId && a.submittedAt != null
    );

    let totalTimeSeconds = 0;
    for (const row of orgProgress) {
      totalTimeSeconds += row.timeSpentSeconds ?? 0;
    }

    const moduleStats = [];
    for (const mod of publishedModules) {
      const moduleAttempts = orgAttempts.filter((a) => a.moduleId === mod._id);
      const userAttempts = new Map<string, typeof moduleAttempts>();
      for (const attempt of moduleAttempts) {
        const list = userAttempts.get(attempt.userId as string) ?? [];
        list.push(attempt);
        userAttempts.set(attempt.userId as string, list);
      }

      let passed = 0;
      let failed = 0;
      let scoreSum = 0;
      let scoreCount = 0;

      for (const attempts of userAttempts.values()) {
        const best = Math.max(...attempts.map((a) => a.score ?? 0));
        scoreSum += best;
        scoreCount++;
        if (best >= mod.passingScore) passed++;
        else failed++;
      }

      const startedUserIds = new Set(
        orgProgress
          .filter((p) => p.moduleId === mod._id)
          .map((p) => p.userId as string)
      );
      for (const uid of userAttempts.keys()) {
        startedUserIds.add(uid);
      }

      moduleStats.push({
        moduleId: mod._id,
        title: mod.title,
        started: startedUserIds.size,
        completedLessons: orgProgress.filter(
          (p) => p.moduleId === mod._id && p.completed
        ).length,
        passed,
        failed,
        avgScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0,
        avgAttempts:
          userAttempts.size > 0
            ? Math.round(
                (moduleAttempts.length / userAttempts.size) * 10
              ) / 10
            : 0,
      });
    }

    const programs = await ctx.db
      .query("trainingPrograms")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();

    let learnersPassedAll = 0;
    for (const learner of activeLearners) {
      for (const program of programs) {
        if (program.status !== "published") continue;
        const enrollment = await ctx.db
          .query("programEnrollments")
          .withIndex("by_user_program", (q) =>
            q.eq("userId", learner._id).eq("programId", program._id)
          )
          .unique();
        if (enrollment?.passed) {
          learnersPassedAll++;
          break;
        }
      }
    }

    const overallCompletionRate =
      activeLearners.length > 0
        ? Math.round((learnersPassedAll / activeLearners.length) * 100)
        : 0;

    const avgTimePerModule =
      publishedModules.length > 0
        ? formatDuration(
            Math.round(totalTimeSeconds / publishedModules.length)
          )
        : "0m";

    const recentLearners = activeLearners
      .slice()
      .sort((a, b) => (b.lastLoginAt ?? 0) - (a.lastLoginAt ?? 0))
      .slice(0, 8)
      .map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        lastLoginAt: u.lastLoginAt,
      }));

    return {
      totalEmployees: activeLearners.length,
      totalModulesPublished: publishedModules.length,
      overallCompletionRate,
      avgTimePerModule,
      moduleStats,
      recentLearners,
    };
  },
});

/** Published programs for learner detail program picker (enrollment flags). */
export const getLearnerProgramOptions = leadOrAdminQuery({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, { userId, organizationId }) => {
    await requireStaffAccessToLearner(ctx, ctx.user, organizationId, userId);
    const programs = await ctx.db
      .query("trainingPrograms")
      .withIndex("by_org_status", (q) =>
        q.eq("organizationId", organizationId).eq("status", "published")
      )
      .collect();

    const options = [];
    for (const program of programs) {
      const enrollment = await ctx.db
        .query("programEnrollments")
        .withIndex("by_user_program", (q) =>
          q.eq("userId", userId).eq("programId", program._id)
        )
        .unique();

      options.push({
        _id: program._id,
        title: program.title,
        enrolled: enrollment != null,
        passed: enrollment?.passed === true,
        enrolledAt: enrollment?.enrolledAt,
      });
    }

    return options.sort((a, b) => {
      if (a.enrolled !== b.enrolled) return a.enrolled ? -1 : 1;
      return a.title.localeCompare(b.title, "fr");
    });
  },
});

/** Per-learner module progress for a training program (admin/lead detail). */
export const getLearnerModuleProgress = leadOrAdminQuery({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    programId: v.id("trainingPrograms"),
  },
  handler: async (ctx, { userId, organizationId, programId }) => {
    await requireStaffAccessToLearner(ctx, ctx.user, organizationId, userId);
    const program = await ctx.db.get(programId);
    if (!program || program.organizationId !== organizationId) {
      throw new Error("Program not found");
    }

    const published = await getProgramPublishedModules(
      ctx,
      programId,
      organizationId
    );

    const enrollment = await ctx.db
      .query("programEnrollments")
      .withIndex("by_user_program", (q) =>
        q.eq("userId", userId).eq("programId", programId)
      )
      .unique();

    const results = [];
    for (const mod of published) {
      const lessons = await ctx.db
        .query("lessons")
        .withIndex("by_module_order", (q) => q.eq("moduleId", mod._id))
        .collect();

      const modProgress = await ctx.db
        .query("lessonProgress")
        .withIndex("by_user_module", (q) =>
          q.eq("userId", userId).eq("moduleId", mod._id)
        )
        .collect();

      const modAttempts = await ctx.db
        .query("examAttempts")
        .withIndex("by_user_module", (q) =>
          q.eq("userId", userId).eq("moduleId", mod._id)
        )
        .collect();
      const submittedAttempts = modAttempts.filter((a) => a.submittedAt != null);

      const completedLessons = modProgress.filter((p) => p.completed).length;
      const bestScore =
        submittedAttempts.length > 0
          ? Math.max(...submittedAttempts.map((a) => a.score ?? 0))
          : null;

      results.push({
        module: mod,
        lessons,
        lessonProgress: modProgress,
        completedLessons,
        totalLessons: lessons.length,
        bestScore,
        passed: bestScore != null && bestScore >= mod.passingScore,
        attemptCount: submittedAttempts.length,
      });
    }

    return {
      program: { _id: program._id, title: program.title },
      enrolled: enrollment != null,
      programPassed: enrollment?.passed === true,
      modules: results,
    };
  },
});

/** Lead view: assigned learners with per-module status */
export const getLeadTeamOverview = leadOrAdminQuery({
  args: {
    leadId: v.id("users"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, { leadId, organizationId }) => {
    const actor = ctx.user;
    assertOrgMember(actor, organizationId);
    const lead = await ctx.db.get(leadId);
    if (!lead || lead.organizationId !== organizationId) {
      throw new Error("Lead not found");
    }
    if (actor.role === "lead" && actor._id !== leadId) {
      throw new Error("Unauthorized");
    }

    const learners = await ctx.db
      .query("users")
      .withIndex("by_lead", (q) => q.eq("leadId", leadId))
      .collect();

    const activeLearners = learners.filter(
      (u) => u.role === "learner" && u.status === "active"
    );

    const modules = await ctx.db
      .query("modules")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();

    const publishedModules = modules
      .filter((m) => m.status === "published")
      .sort((a, b) => a.order - b.order);

    const team = [];
    for (const learner of activeLearners) {
      const moduleProgress: Record<string, string> = {};
      let completedModules = 0;

      for (const mod of publishedModules) {
        const modProgress = await ctx.db
          .query("lessonProgress")
          .withIndex("by_user_module", (q) =>
            q.eq("userId", learner._id).eq("moduleId", mod._id)
          )
          .collect();

        const attempts = await ctx.db
          .query("examAttempts")
          .withIndex("by_user_module", (q) =>
            q.eq("userId", learner._id).eq("moduleId", mod._id)
          )
          .collect();

        const submitted = attempts.filter((a) => a.submittedAt != null);
        const bestScore =
          submitted.length > 0
            ? Math.max(...submitted.map((a) => a.score ?? 0))
            : null;
        const passed = bestScore != null && bestScore >= mod.passingScore;

        let status = "not_started";
        if (passed) {
          status = "completed";
          completedModules++;
        } else if (
          modProgress.some((p) => p.completed) ||
          submitted.length > 0
        ) {
          status = "in_progress";
        }

        moduleProgress[mod._id as string] = status;
      }

      const overallPct =
        publishedModules.length > 0
          ? Math.round((completedModules / publishedModules.length) * 100)
          : 0;

      team.push({
        _id: learner._id,
        name: learner.name,
        email: learner.email,
        phone: learner.phone,
        status: learner.status,
        lastLoginAt: learner.lastLoginAt,
        moduleProgress,
        overallPct,
      });
    }

    return {
      learners: team,
      modules: publishedModules.map((m) => ({
        _id: m._id,
        title: m.title,
      })),
    };
  },
});

/**
 * Admin statistics scoped to a training program, with optional learner category filter.
 * Category breakdown is always shown for the whole program; KPIs and lists use the filter.
 */
export const getProgramStats = adminQuery({
  args: {
    organizationId: v.id("organizations"),
    programId: v.id("trainingPrograms"),
    learnerCategoryKey: learnerCategoryFilterValidator,
  },
  handler: async (ctx, { organizationId, programId, learnerCategoryKey }) => {
    assertOrgAdmin(ctx.user, organizationId);
    const program = await ctx.db.get(programId);
    if (!program || program.organizationId !== organizationId) {
      throw new Error("Program not found");
    }

    const categoryFilter = learnerCategoryKey as
      | LearnerCategoryFilter
      | undefined;

    const programModules = await getProgramPublishedModules(
      ctx,
      programId,
      organizationId
    );
    const moduleIds = programModules.map((m) => m._id);
    const moduleIdSet = new Set(moduleIds.map((id) => id as string));

    const enrolledLearners = await getEnrolledActiveLearners(
      ctx,
      programId,
      organizationId
    );

    const buckets = buildCategoryBuckets();
    for (const learner of enrolledLearners) {
      const bucketKey = getCategoryBucketKey(learner);
      const b = buckets[bucketKey];
      b.total += 1;
      const status = await learnerProgramStatus(
        ctx,
        learner._id,
        programId,
        moduleIds
      );
      if (status === "completed") b.completed += 1;
      else if (status === "in_progress") b.inProgress += 1;
      else b.notStarted += 1;
    }

    const categoryStats = Object.values(buckets).filter(
      (b) => b.total > 0 || b.key !== "uncategorized"
    );

    const cohort = enrolledLearners.filter((l) =>
      matchesCategoryFilter(l, categoryFilter)
    );
    const cohortIds = new Set(cohort.map((l) => l._id as string));

    const allProgress = await ctx.db.query("lessonProgress").collect();
    const programProgress = allProgress.filter(
      (p) =>
        p.organizationId === organizationId &&
        moduleIdSet.has(p.moduleId as string) &&
        cohortIds.has(p.userId as string)
    );

    const allAttempts = await ctx.db.query("examAttempts").collect();
    const programAttempts = allAttempts.filter(
      (a) =>
        a.organizationId === organizationId &&
        a.submittedAt != null &&
        moduleIdSet.has(a.moduleId as string) &&
        cohortIds.has(a.userId as string)
    );

    let totalTimeSeconds = 0;
    for (const row of programProgress) {
      totalTimeSeconds += row.timeSpentSeconds ?? 0;
    }

    const moduleStats = [];
    for (const mod of programModules) {
      const moduleAttempts = programAttempts.filter(
        (a) => a.moduleId === mod._id
      );
      const userAttempts = new Map<string, typeof moduleAttempts>();
      for (const attempt of moduleAttempts) {
        const list = userAttempts.get(attempt.userId as string) ?? [];
        list.push(attempt);
        userAttempts.set(attempt.userId as string, list);
      }

      let passed = 0;
      let failed = 0;
      let scoreSum = 0;
      let scoreCount = 0;

      for (const attempts of userAttempts.values()) {
        const best = Math.max(...attempts.map((a) => a.score ?? 0));
        scoreSum += best;
        scoreCount++;
        if (best >= mod.passingScore) passed++;
        else failed++;
      }

      const startedUserIds = new Set(
        programProgress
          .filter((p) => p.moduleId === mod._id)
          .map((p) => p.userId as string)
      );
      for (const uid of userAttempts.keys()) {
        startedUserIds.add(uid);
      }

      moduleStats.push({
        moduleId: mod._id,
        title: mod.title,
        started: startedUserIds.size,
        completedLessons: programProgress.filter(
          (p) => p.moduleId === mod._id && p.completed
        ).length,
        passed,
        failed,
        avgScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0,
        avgAttempts:
          userAttempts.size > 0
            ? Math.round(
                (moduleAttempts.length / userAttempts.size) * 10
              ) / 10
            : 0,
      });
    }

    let passedCount = 0;
    for (const learner of cohort) {
      const enrollment = await ctx.db
        .query("programEnrollments")
        .withIndex("by_user_program", (q) =>
          q.eq("userId", learner._id).eq("programId", programId)
        )
        .unique();
      if (enrollment?.passed) passedCount++;
    }

    const completionRate =
      cohort.length > 0
        ? Math.round((passedCount / cohort.length) * 100)
        : 0;

    const avgTimePerModule =
      programModules.length > 0
        ? formatDuration(
            Math.round(totalTimeSeconds / programModules.length)
          )
        : "0m";

    const recentLearners = cohort
      .slice()
      .sort((a, b) => (b.lastLoginAt ?? 0) - (a.lastLoginAt ?? 0))
      .slice(0, 8)
      .map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        learnerCategoryKey: u.learnerCategoryKey,
        lastLoginAt: u.lastLoginAt,
      }));

    return {
      program: { _id: program._id, title: program.title },
      categoryStats,
      enrolledLearners: cohort.length,
      modulesInProgram: programModules.length,
      completionRate,
      avgTimePerModule,
      moduleStats,
      recentLearners,
    };
  },
});

