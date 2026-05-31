import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  DEFAULT_EVALUATION_POLICY,
  canUnlockGeneralExam,
  computeFinalScore,
  validateEvaluationPolicy,
  type ModuleExamSummary,
} from "./lib/evaluation";
import { evaluationPolicyValidator } from "./schema";

async function getProgramModuleIds(ctx: { db: any }, programId: any) {
  const links = await ctx.db
    .query("trainingProgramModules")
    .withIndex("by_program_order", (q: any) => q.eq("programId", programId))
    .collect();
  return links;
}

async function countPublishedModulesInProgram(
  ctx: { db: any },
  programId: any
): Promise<number> {
  const links = await getProgramModuleIds(ctx, programId);
  let count = 0;
  for (const link of links) {
    const mod = await ctx.db.get(link.moduleId);
    if (mod?.status === "published") count++;
  }
  return count;
}

/** Learner-visible: published program with ≥1 published module */
export async function isProgramAvailableToLearners(
  ctx: { db: any },
  program: { _id: any; status: string }
): Promise<boolean> {
  if (program.status !== "published") return false;
  const count = await countPublishedModulesInProgram(ctx, program._id);
  return count >= 1;
}

async function getModuleExamSummaries(
  ctx: { db: any },
  userId: any,
  moduleIds: any[]
): Promise<ModuleExamSummary[]> {
  const summaries: ModuleExamSummary[] = [];

  for (const moduleId of moduleIds) {
    const attempts = await ctx.db
      .query("examAttempts")
      .withIndex("by_user_module", (q: any) =>
        q.eq("userId", userId).eq("moduleId", moduleId)
      )
      .collect();

    const submitted = attempts.filter((a: any) => a.submittedAt != null);
    const bestScore =
      submitted.length > 0
        ? Math.max(...submitted.map((a: any) => a.score ?? 0))
        : null;

    const mod = await ctx.db.get(moduleId);
    const passed =
      bestScore != null && mod != null && bestScore >= mod.passingScore;

    summaries.push({
      moduleId: moduleId as string,
      bestScore,
      passed: Boolean(passed),
      hasSubmittedAttempt: submitted.length > 0,
      attemptCount: submitted.length,
    });
  }

  return summaries;
}

async function buildEvaluationSnapshot(
  ctx: { db: any },
  program: any,
  userId: any
) {
  const policy = program.evaluationPolicy ?? DEFAULT_EVALUATION_POLICY;
  const links = await getProgramModuleIds(ctx, program._id);
  const modules: any[] = [];
  const moduleSummaries: ModuleExamSummary[] = [];

  for (const link of links) {
    const mod = await ctx.db.get(link.moduleId);
    if (!mod || mod.status !== "published") continue;
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_module_order", (q: any) => q.eq("moduleId", mod._id))
      .collect();
    modules.push({ ...mod, order: link.order, lessonCount: lessons.length });
    const [summary] = await getModuleExamSummaries(ctx, userId, [mod._id]);
    moduleSummaries.push(summary);
  }
  modules.sort((a, b) => a.order - b.order);
  const sortedSummaries: ModuleExamSummary[] = modules.map(
    (mod) => moduleSummaries.find((m) => m.moduleId === mod._id)!
  );

  const generalAttempts = await ctx.db
    .query("generalExamAttempts")
    .withIndex("by_user_program", (q: any) =>
      q.eq("userId", userId).eq("programId", program._id)
    )
    .collect();

  const submittedGeneral = generalAttempts.filter(
    (a: any) => a.submittedAt != null
  );
  const bestGeneralScore =
    submittedGeneral.length > 0
      ? Math.max(...submittedGeneral.map((a: any) => a.score ?? 0))
      : null;

  const moduleBestScores = moduleSummaries
    .map((m) => m.bestScore)
    .filter((s): s is number => s != null);

  const finalScore = computeFinalScore(
    policy,
    moduleBestScores,
    policy.generalExamEnabled ? bestGeneralScore : null
  );

  const passed = finalScore >= policy.programPassThreshold;
  const generalUnlocked = canUnlockGeneralExam(policy, moduleSummaries);

  const enrollment = await ctx.db
    .query("programEnrollments")
    .withIndex("by_user_program", (q: any) =>
      q.eq("userId", userId).eq("programId", program._id)
    )
    .unique();

  const programCompleted = Boolean(enrollment?.completedAt && enrollment?.passed);

  return {
    policy,
    modules: modules.map((mod) => {
      const examSummary = sortedSummaries.find((m) => m.moduleId === mod._id);
      return { ...mod, examSummary };
    }),
    moduleSummaries: sortedSummaries,
    bestGeneralScore,
    finalScore,
    passed,
    generalUnlocked,
    generalExamEnabled: policy.generalExamEnabled,
    programCompleted,
    enrollment,
    generalAttemptsCount: generalAttempts.length,
    submittedGeneralCount: submittedGeneral.length,
  };
}

// ── Admin list / CRUD ───────────────────────────────────────────────────────

export const listForOrg = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const programs = await ctx.db
      .query("trainingPrograms")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();

    return Promise.all(
      programs.map(async (p) => {
        const moduleCount = await countPublishedModulesInProgram(ctx, p._id);
        const links = await getProgramModuleIds(ctx, p._id);
        return {
          ...p,
          moduleCount,
          totalLinkedModules: links.length,
          learnerReady: await isProgramAvailableToLearners(ctx, p),
        };
      })
    );
  },
});

export const getById = query({
  args: { programId: v.id("trainingPrograms") },
  handler: async (ctx, { programId }) => {
    const program = await ctx.db.get(programId);
    if (!program) return null;

    const links = await getProgramModuleIds(ctx, programId);
    const modules = await Promise.all(
      links.map(async (link) => {
        const mod = await ctx.db.get(link.moduleId);
        return mod ? { ...mod, linkOrder: link.order, linkId: link._id } : null;
      })
    );

    const settings = await ctx.db
      .query("generalExamSettings")
      .withIndex("by_program", (q) => q.eq("programId", programId))
      .unique();

    const generalQuestionCount = (
      await ctx.db
        .query("generalExamQuestions")
        .withIndex("by_program", (q) => q.eq("programId", programId))
        .collect()
    ).length;

    return {
      program,
      modules: modules.filter(Boolean),
      generalExamSettings: settings,
      generalQuestionCount,
      learnerReady: await isProgramAvailableToLearners(ctx, program),
    };
  },
});

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.string(),
    createdBy: v.id("users"),
    accessMode: v.optional(v.union(v.literal("open"), v.literal("closed"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("trainingPrograms", {
      organizationId: args.organizationId,
      title: args.title,
      description: args.description,
      status: "draft",
      accessMode: args.accessMode ?? "open",
      evaluationPolicy: { ...DEFAULT_EVALUATION_POLICY },
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    programId: v.id("trainingPrograms"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    accessMode: v.optional(v.union(v.literal("open"), v.literal("closed"))),
    evaluationPolicy: v.optional(evaluationPolicyValidator),
  },
  handler: async (ctx, { programId, evaluationPolicy, ...rest }) => {
    const program = await ctx.db.get(programId);
    if (!program) throw new Error("Program not found");

    if (evaluationPolicy) {
      validateEvaluationPolicy(evaluationPolicy);
    }

    if (rest.status === "published") {
      const count = await countPublishedModulesInProgram(ctx, programId);
      if (count < 1) {
        throw new Error(
          "Cannot publish: attach at least one published module to the program"
        );
      }
    }

    await ctx.db.patch(programId, {
      ...rest,
      ...(evaluationPolicy ? { evaluationPolicy } : {}),
      updatedAt: Date.now(),
    });
  },
});

export const addModule = mutation({
  args: {
    programId: v.id("trainingPrograms"),
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const mod = await ctx.db.get(args.moduleId);
    if (!mod) throw new Error("Module not found");
    if (mod.organizationId !== args.organizationId) {
      throw new Error("Module does not belong to this organization");
    }

    const existingLink = await ctx.db
      .query("trainingProgramModules")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .unique();
    if (existingLink?.programId === args.programId) {
      return existingLink._id;
    }
    if (existingLink) {
      await ctx.db.delete(existingLink._id);
    }

    const links = await getProgramModuleIds(ctx, args.programId);
    return ctx.db.insert("trainingProgramModules", {
      programId: args.programId,
      moduleId: args.moduleId,
      organizationId: args.organizationId,
      order: links.length,
    });
  },
});

export const removeModule = mutation({
  args: { linkId: v.id("trainingProgramModules") },
  handler: async (ctx, { linkId }) => {
    await ctx.db.delete(linkId);
  },
});

export const remove = mutation({
  args: { programId: v.id("trainingPrograms") },
  handler: async (ctx, { programId }) => {
    const program = await ctx.db.get(programId);
    if (!program) throw new Error("Program not found");

    const links = await ctx.db
      .query("trainingProgramModules")
      .withIndex("by_program", (q) => q.eq("programId", programId))
      .collect();
    for (const link of links) {
      await ctx.db.delete(link._id);
    }

    const generalQuestions = await ctx.db
      .query("generalExamQuestions")
      .withIndex("by_program", (q) => q.eq("programId", programId))
      .collect();
    for (const question of generalQuestions) {
      await ctx.db.delete(question._id);
    }

    const generalSettings = await ctx.db
      .query("generalExamSettings")
      .withIndex("by_program", (q) => q.eq("programId", programId))
      .unique();
    if (generalSettings) {
      await ctx.db.delete(generalSettings._id);
    }

    const enrollments = await ctx.db
      .query("programEnrollments")
      .withIndex("by_program", (q) => q.eq("programId", programId))
      .collect();
    for (const enrollment of enrollments) {
      await ctx.db.delete(enrollment._id);
    }

    const generalAttempts = await ctx.db
      .query("generalExamAttempts")
      .withIndex("by_program", (q) => q.eq("programId", programId))
      .collect();
    for (const attempt of generalAttempts) {
      await ctx.db.delete(attempt._id);
    }

    const certificates = await ctx.db.query("certificates").collect();
    for (const cert of certificates) {
      if (cert.programId === programId) {
        await ctx.db.delete(cert._id);
      }
    }

    await ctx.db.delete(programId);
  },
});

// ── Learner catalog & enrollment ──────────────────────────────────────────

export const listAvailableForLearner = query({
  args: { organizationId: v.id("organizations"), userId: v.id("users") },
  handler: async (ctx, { organizationId, userId }) => {
    const programs = await ctx.db
      .query("trainingPrograms")
      .withIndex("by_org_status", (q) =>
        q.eq("organizationId", organizationId).eq("status", "published")
      )
      .collect();

    const results = [];
    for (const program of programs) {
      if (!(await isProgramAvailableToLearners(ctx, program))) continue;

      const enrollment = await ctx.db
        .query("programEnrollments")
        .withIndex("by_user_program", (q) =>
          q.eq("userId", userId).eq("programId", program._id)
        )
        .unique();

      const links = await getProgramModuleIds(ctx, program._id);
      const moduleIds: string[] = [];
      for (const link of links) {
        const mod = await ctx.db.get(link.moduleId);
        if (mod?.status === "published") moduleIds.push(mod._id);
      }

      results.push({
        ...program,
        moduleIds,
        moduleCount: moduleIds.length,
        enrolled: Boolean(enrollment),
        enrollment,
        canJoin: program.accessMode === "open" && !enrollment,
      });
    }
    return results;
  },
});

export const enroll = mutation({
  args: {
    userId: v.id("users"),
    programId: v.id("trainingPrograms"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const program = await ctx.db.get(args.programId);
    if (!program) throw new Error("Program not found");
    if (!(await isProgramAvailableToLearners(ctx, program))) {
      throw new Error("This program is not available");
    }
    if (program.accessMode !== "open") {
      throw new Error("This program requires admin enrollment");
    }

    const existing = await ctx.db
      .query("programEnrollments")
      .withIndex("by_user_program", (q) =>
        q.eq("userId", args.userId).eq("programId", args.programId)
      )
      .unique();
    if (existing) return existing._id;

    return ctx.db.insert("programEnrollments", {
      userId: args.userId,
      programId: args.programId,
      organizationId: args.organizationId,
      enrolledAt: Date.now(),
    });
  },
});

export const getLearnerEvaluation = query({
  args: {
    programId: v.id("trainingPrograms"),
    userId: v.id("users"),
  },
  handler: async (ctx, { programId, userId }) => {
    const program = await ctx.db.get(programId);
    if (!program) return null;

    const enrollment = await ctx.db
      .query("programEnrollments")
      .withIndex("by_user_program", (q) =>
        q.eq("userId", userId).eq("programId", programId)
      )
      .unique();

    const snapshot = await buildEvaluationSnapshot(ctx, program, userId);

    return {
      program,
      enrollment,
      enrolled: Boolean(enrollment),
      ...snapshot,
    };
  },
});

/** Recompute and persist enrollment outcome; issue certificate if passed. */
export const finalizeProgramEvaluation = mutation({
  args: {
    userId: v.id("users"),
    programId: v.id("trainingPrograms"),
  },
  handler: async (ctx, { userId, programId }) => {
    const program = await ctx.db.get(programId);
    if (!program) throw new Error("Program not found");

    const snapshot = await buildEvaluationSnapshot(ctx, program, userId);
    const { policy, finalScore, passed, generalExamEnabled, generalUnlocked } =
      snapshot;

    if (generalExamEnabled && !generalUnlocked) {
      throw new Error("Complete all module exams before finalizing");
    }

    if (generalExamEnabled && snapshot.bestGeneralScore == null) {
      throw new Error("Complete the final evaluation exam first");
    }

    if (!generalExamEnabled && snapshot.moduleSummaries.some((m) => !m.hasSubmittedAttempt)) {
      throw new Error("Complete all module exams first");
    }

    let enrollment = snapshot.enrollment;
    if (!enrollment) {
      const enrollmentId = await ctx.db.insert("programEnrollments", {
        userId,
        programId,
        organizationId: program.organizationId,
        enrolledAt: Date.now(),
      });
      enrollment = await ctx.db.get(enrollmentId);
    }

    if (!enrollment) throw new Error("Enrollment failed");

    await ctx.db.patch(enrollment._id, {
      finalScore,
      passed,
      completedAt: passed ? Date.now() : enrollment.completedAt,
    });

    if (passed) {
      const existingCert = await ctx.db
        .query("certificates")
        .withIndex("by_user_program", (q) =>
          q.eq("userId", userId).eq("programId", programId)
        )
        .unique();

      if (!existingCert) {
        const year = new Date().getFullYear();
        const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
        await ctx.db.insert("certificates", {
          userId,
          programId,
          organizationId: program.organizationId,
          score: finalScore,
          issuedAt: Date.now(),
          certificateNumber: `EVT-${year}-${suffix}`,
        });
      }
    }

    return { finalScore, passed };
  },
});

export const getLearnerProgramProgress = query({
  args: { userId: v.id("users"), programId: v.id("trainingPrograms") },
  handler: async (ctx, args) => {
    const program = await ctx.db.get(args.programId);
    if (!program) return null;
    return buildEvaluationSnapshot(ctx, program, args.userId);
  },
});

/** Lead/admin: evaluation breakdown for a learner in a program */
export const getEvaluationForStaff = query({
  args: {
    userId: v.id("users"),
    programId: v.id("trainingPrograms"),
  },
  handler: async (ctx, args) => {
    const program = await ctx.db.get(args.programId);
    if (!program) return null;
    const user = await ctx.db.get(args.userId);
    const snapshot = await buildEvaluationSnapshot(ctx, program, args.userId);
    return { user, program, ...snapshot };
  },
});
