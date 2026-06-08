import {
  adminMutation,
  adminQuery,
  authedMutation,
  authedQuery,
} from "./lib/functions";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { assertOrgAdmin, assertOrgMember } from "./lib/requireAuth";
import {
  assertAttemptOpenForEdit,
  assertSubmitAllowed,
  DEFAULT_MODULE_EXAM_MINUTES,
  getRemainingSeconds,
  isAttemptExpired,
  resolveTimeLimitMinutes,
} from "./lib/examAttempt";

async function requireModuleInOrg(
  ctx: { db: { get: (id: any) => Promise<any> } },
  moduleId: string,
  organizationId: string
) {
  const mod = await ctx.db.get(moduleId);
  if (!mod || mod.organizationId !== organizationId) {
    throw new Error("Module not found");
  }
  return mod;
}

async function requireOwnedAttempt(
  ctx: { db: { get: (id: any) => Promise<any> } },
  attemptId: string,
  userId: string
) {
  const attempt = await ctx.db.get(attemptId);
  if (!attempt || attempt.userId !== userId) {
    throw new Error("Unauthorized");
  }
  return attempt;
}

type AnswerInput = {
  questionId: Id<"examQuestions">;
  selectedOptionId: string;
};

async function loadModuleExamSettings(
  ctx: MutationCtx,
  moduleId: Id<"modules">
) {
  return ctx.db
    .query("examSettings")
    .withIndex("by_module", (q) => q.eq("moduleId", moduleId))
    .unique();
}

async function finalizeModuleAttempt(
  ctx: MutationCtx,
  attempt: Doc<"examAttempts">,
  answers: AnswerInput[]
) {
  const questions = await ctx.db
    .query("examQuestions")
    .withIndex("by_module", (q) => q.eq("moduleId", attempt.moduleId))
    .collect();

  let correct = 0;
  for (const answer of answers) {
    const q = questions.find((item) => item._id === answer.questionId);
    if (q && q.correctOptionId === answer.selectedOptionId) {
      correct++;
    }
  }
  const score =
    questions.length > 0 ? (correct / questions.length) * 100 : 0;

  const module_ = await ctx.db.get(attempt.moduleId);
  const passed = module_ ? score >= module_.passingScore : false;

  await ctx.db.patch(attempt._id, {
    answers,
    score: Math.round(score),
    passed,
    submittedAt: Date.now(),
  });

  return { score: Math.round(score), passed };
}

export const listQuestions = authedQuery({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    const user = ctx.user;
    const mod = await ctx.db.get(moduleId);
    if (!mod || mod.organizationId !== user.organizationId) {
      throw new Error("Unauthorized");
    }
    return ctx.db
      .query("examQuestions")
      .withIndex("by_module_order", (q) => q.eq("moduleId", moduleId))
      .collect();
  },
});

export const createQuestion = adminMutation({
  args: {
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    questionText: v.string(),
    imageUrl: v.optional(v.string()),
    options: v.array(v.object({ id: v.string(), text: v.string() })),
    correctOptionId: v.string(),
  },
  handler: async (ctx, args) => {
    assertOrgAdmin(ctx.user, args.organizationId);
    await requireModuleInOrg(ctx, args.moduleId, args.organizationId);
    const existing = await ctx.db
      .query("examQuestions")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .collect();
    return ctx.db.insert("examQuestions", {
      ...args,
      order: existing.length,
      createdAt: Date.now(),
    });
  },
});

export const updateQuestion = adminMutation({
  args: {
    questionId: v.id("examQuestions"),
    questionText: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    options: v.optional(
      v.array(v.object({ id: v.string(), text: v.string() }))
    ),
    correctOptionId: v.optional(v.string()),
  },
  handler: async (ctx, { questionId, ...updates }) => {
    const question = await ctx.db.get(questionId);
    if (!question) throw new Error("Question not found");
    assertOrgAdmin(ctx.user, question.organizationId);
    await ctx.db.patch(questionId, updates);
  },
});

export const deleteQuestion = adminMutation({
  args: { questionId: v.id("examQuestions") },
  handler: async (ctx, { questionId }) => {
    const question = await ctx.db.get(questionId);
    if (!question) throw new Error("Question not found");
    assertOrgAdmin(ctx.user, question.organizationId);
    await ctx.db.delete(questionId);
  },
});

export const getSettings = authedQuery({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    const user = ctx.user;
    const mod = await ctx.db.get(moduleId);
    if (!mod || mod.organizationId !== user.organizationId) {
      throw new Error("Unauthorized");
    }
    return ctx.db
      .query("examSettings")
      .withIndex("by_module", (q) => q.eq("moduleId", moduleId))
      .unique();
  },
});

export const upsertSettings = adminMutation({
  args: {
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    timeLimitMinutes: v.optional(v.number()),
    showCorrectAnswers: v.boolean(),
    allowReview: v.boolean(),
    randomizeQuestions: v.boolean(),
  },
  handler: async (ctx, args) => {
    assertOrgAdmin(ctx.user, args.organizationId);
    const existing = await ctx.db
      .query("examSettings")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("examSettings", args);
    }
  },
});

export const getAttempts = authedQuery({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    const user = ctx.user;
    return ctx.db
      .query("examAttempts")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", user._id).eq("moduleId", moduleId)
      )
      .collect();
  },
});

export const getActiveAttempt = authedQuery({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    const user = ctx.user;
    const mod = await ctx.db.get(moduleId);
    if (!mod || mod.organizationId !== user.organizationId) {
      throw new Error("Unauthorized");
    }

    const attempts = await ctx.db
      .query("examAttempts")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", user._id).eq("moduleId", moduleId)
      )
      .collect();

    const active = attempts.find((a) => a.submittedAt == null);
    if (!active) return null;

    const limit = active.timeLimitMinutes ?? 0;
    const remainingSeconds = getRemainingSeconds(active.startedAt, limit);
    const expired = limit > 0 && (remainingSeconds ?? 0) === 0;

    return {
      attemptId: active._id,
      attemptNumber: active.attemptNumber,
      startedAt: active.startedAt,
      timeLimitMinutes: limit,
      savedAnswers: active.savedAnswers ?? [],
      remainingSeconds,
      expired,
    };
  },
});

export const getAllAttemptsForModule = adminQuery({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    const user = ctx.user;
    const mod = await ctx.db.get(moduleId);
    if (!mod || mod.organizationId !== user.organizationId) {
      throw new Error("Unauthorized");
    }
    return ctx.db
      .query("examAttempts")
      .withIndex("by_module", (q) => q.eq("moduleId", moduleId))
      .collect();
  },
});

export const startAttempt = authedMutation({
  args: {
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const user = ctx.user;
    assertOrgMember(user, args.organizationId);
    const mod = await requireModuleInOrg(ctx, args.moduleId, args.organizationId);

    const prior = await ctx.db
      .query("examAttempts")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", user._id).eq("moduleId", args.moduleId)
      )
      .collect();

    const active = prior.find((a) => a.submittedAt == null);
    if (active) {
      const limit = active.timeLimitMinutes ?? 0;
      if (limit <= 0 || !isAttemptExpired(active.startedAt, limit)) {
        return {
          attemptId: active._id,
          startedAt: active.startedAt,
          timeLimitMinutes: limit,
          savedAnswers: active.savedAnswers ?? [],
          resumed: true,
        };
      }
      await finalizeModuleAttempt(ctx, active, active.savedAnswers ?? []);
    }

    const submitted = prior.filter((a) => a.submittedAt != null);
    const maxRetakes = mod.maxRetakes ?? 2;
    if (maxRetakes !== "unlimited" && submitted.length >= maxRetakes) {
      throw new Error("Nombre maximum de tentatives atteint.");
    }

    const settings = await loadModuleExamSettings(ctx, args.moduleId);
    const timeLimitMinutes = resolveTimeLimitMinutes(
      settings?.timeLimitMinutes,
      DEFAULT_MODULE_EXAM_MINUTES
    );

    const startedAt = Date.now();
    const attemptId = await ctx.db.insert("examAttempts", {
      userId: user._id,
      moduleId: args.moduleId,
      organizationId: args.organizationId,
      attemptNumber: submitted.length + 1,
      answers: [],
      timeLimitMinutes,
      startedAt,
    });

    return {
      attemptId,
      startedAt,
      timeLimitMinutes,
      savedAnswers: [],
      resumed: false,
    };
  },
});

export const saveProgress = authedMutation({
  args: {
    attemptId: v.id("examAttempts"),
    savedAnswers: v.array(
      v.object({
        questionId: v.id("examQuestions"),
        selectedOptionId: v.string(),
      })
    ),
  },
  handler: async (ctx, { attemptId, savedAnswers }) => {
    const user = ctx.user;
    const attempt = await requireOwnedAttempt(ctx, attemptId, user._id);
    assertAttemptOpenForEdit(
      attempt.startedAt,
      attempt.timeLimitMinutes,
      attempt.submittedAt
    );
    await ctx.db.patch(attemptId, { savedAnswers });
  },
});

export const finalizeExpiredAttempt = authedMutation({
  args: { attemptId: v.id("examAttempts") },
  handler: async (ctx, { attemptId }) => {
    const user = ctx.user;
    const attempt = await requireOwnedAttempt(ctx, attemptId, user._id);
    if (attempt.submittedAt != null) {
      return {
        score: attempt.score ?? 0,
        passed: attempt.passed ?? false,
        alreadySubmitted: true,
      };
    }

    const limit = attempt.timeLimitMinutes ?? 0;
    if (limit > 0 && !isAttemptExpired(attempt.startedAt, limit)) {
      throw new Error("Exam is still in progress");
    }

    return {
      ...(await finalizeModuleAttempt(
        ctx,
        attempt,
        attempt.savedAnswers ?? []
      )),
      alreadySubmitted: false,
    };
  },
});

export const submitAttempt = authedMutation({
  args: {
    attemptId: v.id("examAttempts"),
    answers: v.array(
      v.object({
        questionId: v.id("examQuestions"),
        selectedOptionId: v.string(),
      })
    ),
  },
  handler: async (ctx, { attemptId, answers }) => {
    const user = ctx.user;
    const attempt = await requireOwnedAttempt(ctx, attemptId, user._id);
    assertSubmitAllowed(
      attempt.startedAt,
      attempt.timeLimitMinutes,
      attempt.submittedAt
    );

    return finalizeModuleAttempt(ctx, attempt, answers);
  },
});
