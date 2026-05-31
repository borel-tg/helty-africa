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

/** Exam questions from one program module (import picker). */
export const listImportableModuleQuestions = query({
  args: {
    programId: v.id("trainingPrograms"),
    moduleId: v.id("modules"),
    search: v.optional(v.string()),
  },
  handler: async (ctx, { programId, moduleId, search }) => {
    const link = await ctx.db
      .query("trainingProgramModules")
      .withIndex("by_program", (q) => q.eq("programId", programId))
      .collect();
    if (!link.some((l) => l.moduleId === moduleId)) {
      return { moduleTitle: "", questions: [] };
    }

    const mod = await ctx.db.get(moduleId);
    const term = search?.trim().toLowerCase() ?? "";

    const imported = await ctx.db
      .query("generalExamQuestions")
      .withIndex("by_program", (q) => q.eq("programId", programId))
      .collect();
    const importedSourceIds = new Set(
      imported
        .map((q) => q.sourceModuleQuestionId)
        .filter((id): id is NonNullable<typeof id> => id != null)
    );

    const questions = await ctx.db
      .query("examQuestions")
      .withIndex("by_module_order", (q) => q.eq("moduleId", moduleId))
      .collect();

    const filtered = questions.filter(
      (q) => !term || q.questionText.toLowerCase().includes(term)
    );

    return {
      moduleTitle: mod?.title ?? "",
      questions: filtered.map((q) => ({
        _id: q._id,
        questionText: q.questionText,
        alreadyImported: importedSourceIds.has(q._id),
      })),
    };
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

export const updateQuestion = mutation({
  args: {
    questionId: v.id("generalExamQuestions"),
    questionText: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    options: v.optional(
      v.array(v.object({ id: v.string(), text: v.string() }))
    ),
    correctOptionId: v.optional(v.string()),
  },
  handler: async (ctx, { questionId, ...updates }) => {
    await ctx.db.patch(questionId, updates);
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

    const links = await ctx.db
      .query("trainingProgramModules")
      .withIndex("by_program", (q) => q.eq("programId", args.programId))
      .collect();
    if (!links.some((l) => l.moduleId === src.moduleId)) {
      throw new Error("Question must belong to a module in this program");
    }

    const existing = await ctx.db
      .query("generalExamQuestions")
      .withIndex("by_program", (q) => q.eq("programId", args.programId))
      .collect();
    if (existing.some((q) => q.sourceModuleQuestionId === src._id)) {
      throw new Error("Question already added to final evaluation");
    }

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
