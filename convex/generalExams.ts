import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listQuestions = query({
  args: { programId: v.id("trainingPrograms") },
  handler: async (ctx, { programId }) => {
    return ctx.db
      .query("generalExamQuestions")
      .withIndex("by_program_order", (q) => q.eq("programId", programId))
      .collect();
  },
});

/** Search module questions in org for importing into general pool */
export const searchModuleQuestions = query({
  args: {
    organizationId: v.id("organizations"),
    search: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { organizationId, search, limit = 20 }) => {
    const term = search.trim().toLowerCase();
    if (!term) return [];

    const modules = await ctx.db
      .query("modules")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();

    const results: Array<{
      question: (typeof modules)[0] extends never ? never : any;
      moduleTitle: string;
      moduleId: any;
    }> = [];

    for (const mod of modules) {
      const questions = await ctx.db
        .query("examQuestions")
        .withIndex("by_module", (q) => q.eq("moduleId", mod._id))
        .collect();

      for (const q of questions) {
        if (q.questionText.toLowerCase().includes(term)) {
          results.push({
            question: q,
            moduleTitle: mod.title,
            moduleId: mod._id,
          });
          if (results.length >= limit) return results;
        }
      }
    }
    return results;
  },
});

export const addQuestion = mutation({
  args: {
    programId: v.id("trainingPrograms"),
    organizationId: v.id("organizations"),
    questionText: v.string(),
    imageUrl: v.optional(v.string()),
    options: v.array(v.object({ id: v.string(), text: v.string() })),
    correctOptionId: v.string(),
    sourceModuleQuestionId: v.optional(v.id("examQuestions")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("generalExamQuestions")
      .withIndex("by_program", (q) => q.eq("programId", args.programId))
      .collect();
    return ctx.db.insert("generalExamQuestions", {
      ...args,
      order: existing.length,
      createdAt: Date.now(),
    });
  },
});

export const importFromModuleQuestion = mutation({
  args: {
    programId: v.id("trainingPrograms"),
    organizationId: v.id("organizations"),
    moduleQuestionId: v.id("examQuestions"),
  },
  handler: async (ctx, args) => {
    const src = await ctx.db.get(args.moduleQuestionId);
    if (!src) throw new Error("Source question not found");

    return ctx.db.insert("generalExamQuestions", {
      programId: args.programId,
      organizationId: args.organizationId,
      questionText: src.questionText,
      imageUrl: src.imageUrl,
      options: src.options,
      correctOptionId: src.correctOptionId,
      sourceModuleQuestionId: src._id,
      order: (
        await ctx.db
          .query("generalExamQuestions")
          .withIndex("by_program", (q) => q.eq("programId", args.programId))
          .collect()
      ).length,
      createdAt: Date.now(),
    });
  },
});

export const deleteQuestion = mutation({
  args: { questionId: v.id("generalExamQuestions") },
  handler: async (ctx, { questionId }) => {
    await ctx.db.delete(questionId);
  },
});

export const getSettings = query({
  args: { programId: v.id("trainingPrograms") },
  handler: async (ctx, { programId }) => {
    return ctx.db
      .query("generalExamSettings")
      .withIndex("by_program", (q) => q.eq("programId", programId))
      .unique();
  },
});

export const upsertSettings = mutation({
  args: {
    programId: v.id("trainingPrograms"),
    organizationId: v.id("organizations"),
    timeLimitMinutes: v.optional(v.number()),
    showCorrectAnswers: v.boolean(),
    allowReview: v.boolean(),
    randomizeQuestions: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("generalExamSettings")
      .withIndex("by_program", (q) => q.eq("programId", args.programId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("generalExamSettings", args);
    }
  },
});

export const getAttempts = query({
  args: {
    userId: v.id("users"),
    programId: v.id("trainingPrograms"),
  },
  handler: async (ctx, { userId, programId }) => {
    return ctx.db
      .query("generalExamAttempts")
      .withIndex("by_user_program", (q) =>
        q.eq("userId", userId).eq("programId", programId)
      )
      .collect();
  },
});

export const startAttempt = mutation({
  args: {
    userId: v.id("users"),
    programId: v.id("trainingPrograms"),
    organizationId: v.id("organizations"),
    attemptNumber: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("generalExamAttempts", {
      ...args,
      answers: [],
      startedAt: Date.now(),
    });
  },
});

export const submitAttempt = mutation({
  args: {
    attemptId: v.id("generalExamAttempts"),
    answers: v.array(
      v.object({
        questionId: v.id("generalExamQuestions"),
        selectedOptionId: v.string(),
      })
    ),
  },
  handler: async (ctx, { attemptId, answers }) => {
    const attempt = await ctx.db.get(attemptId);
    if (!attempt) throw new Error("Attempt not found");

    const questions = await ctx.db
      .query("generalExamQuestions")
      .withIndex("by_program", (q) => q.eq("programId", attempt.programId))
      .collect();

    let correct = 0;
    for (const answer of answers) {
      const q = questions.find((item) => item._id === answer.questionId);
      if (q && q.correctOptionId === answer.selectedOptionId) correct++;
    }
    const score =
      questions.length > 0 ? (correct / questions.length) * 100 : 0;
    const rounded = Math.round(score * 10) / 10;

    await ctx.db.patch(attemptId, {
      answers,
      score: rounded,
      submittedAt: Date.now(),
    });

    return { score: rounded };
  },
});
