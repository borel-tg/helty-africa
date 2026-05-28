import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Questions ──────────────────────────────────────────────────────────────

export const listQuestions = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    return ctx.db
      .query("examQuestions")
      .withIndex("by_module_order", (q) => q.eq("moduleId", moduleId))
      .collect();
  },
});

export const createQuestion = mutation({
  args: {
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    questionText: v.string(),
    imageUrl: v.optional(v.string()),
    options: v.array(v.object({ id: v.string(), text: v.string() })),
    correctOptionId: v.string(),
  },
  handler: async (ctx, args) => {
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

export const updateQuestion = mutation({
  args: {
    questionId: v.id("examQuestions"),
    questionText: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    options: v.optional(v.array(v.object({ id: v.string(), text: v.string() }))),
    correctOptionId: v.optional(v.string()),
  },
  handler: async (ctx, { questionId, ...updates }) => {
    await ctx.db.patch(questionId, updates);
  },
});

export const deleteQuestion = mutation({
  args: { questionId: v.id("examQuestions") },
  handler: async (ctx, { questionId }) => {
    await ctx.db.delete(questionId);
  },
});

// ── Exam Settings ──────────────────────────────────────────────────────────

export const getSettings = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    return ctx.db
      .query("examSettings")
      .withIndex("by_module", (q) => q.eq("moduleId", moduleId))
      .unique();
  },
});

export const upsertSettings = mutation({
  args: {
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    timeLimitMinutes: v.optional(v.number()),
    showCorrectAnswers: v.boolean(),
    allowReview: v.boolean(),
    randomizeQuestions: v.boolean(),
  },
  handler: async (ctx, args) => {
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

// ── Exam Attempts ──────────────────────────────────────────────────────────

export const getAttempts = query({
  args: { userId: v.id("users"), moduleId: v.id("modules") },
  handler: async (ctx, { userId, moduleId }) => {
    return ctx.db
      .query("examAttempts")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", userId).eq("moduleId", moduleId)
      )
      .collect();
  },
});

export const getAllAttemptsForModule = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    return ctx.db
      .query("examAttempts")
      .withIndex("by_module", (q) => q.eq("moduleId", moduleId))
      .collect();
  },
});

export const startAttempt = mutation({
  args: {
    userId: v.id("users"),
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    attemptNumber: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("examAttempts", {
      ...args,
      answers: [],
      startedAt: Date.now(),
    });
  },
});

export const saveProgress = mutation({
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
    await ctx.db.patch(attemptId, { savedAnswers });
  },
});

export const submitAttempt = mutation({
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
    const attempt = await ctx.db.get(attemptId);
    if (!attempt) throw new Error("Attempt not found");

    // Fetch questions to calculate score
    const questions = await ctx.db
      .query("examQuestions")
      .withIndex("by_module", (q) => q.eq("moduleId", attempt.moduleId))
      .collect();

    let correct = 0;
    for (const answer of answers) {
      const q = questions.find((q) => q._id === answer.questionId);
      if (q && q.correctOptionId === answer.selectedOptionId) {
        correct++;
      }
    }
    const score = questions.length > 0 ? (correct / questions.length) * 100 : 0;

    // Get module to check passing score
    const module_ = await ctx.db.get(attempt.moduleId);
    const passed = module_ ? score >= module_.passingScore : false;

    await ctx.db.patch(attemptId, {
      answers,
      score: Math.round(score),
      passed,
      submittedAt: Date.now(),
    });

    return { score: Math.round(score), passed };
  },
});
