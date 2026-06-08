import {
  adminMutation,
  adminQuery,
  authedMutation,
  authedQuery,
} from "./lib/functions";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { assertOrgAdmin, assertOrgMember, type SafeUser } from "./lib/requireAuth";

async function requireProgramAdmin(
  ctx: QueryCtx | MutationCtx,
  user: SafeUser,
  programId: Id<"trainingPrograms">
) {
  const program = await ctx.db.get(programId);
  if (!program) throw new Error("Program not found");
  assertOrgAdmin(user, program.organizationId);
  return program;
}

export const listQuestions = authedQuery({
  args: { programId: v.id("trainingPrograms") },
  handler: async (ctx, { programId }) => {
    const program = await ctx.db.get(programId);
    if (!program) return [];
    const user = ctx.user;
    if (program.organizationId !== user.organizationId) {
      throw new Error("Unauthorized");
    }
    return ctx.db
      .query("generalExamQuestions")
      .withIndex("by_program_order", (q) => q.eq("programId", programId))
      .collect();
  },
});

/** Exam questions from one program module (import picker). */
export const listImportableModuleQuestions = adminQuery({
  args: {
    programId: v.id("trainingPrograms"),
    moduleId: v.id("modules"),
    search: v.optional(v.string()),
  },
  handler: async (ctx, { programId, moduleId, search }) => {
    await requireProgramAdmin(ctx, ctx.user, programId);
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

export const addQuestion = adminMutation({
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
    assertOrgAdmin(ctx.user, args.organizationId);
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

export const updateQuestion = adminMutation({
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
    const question = await ctx.db.get(questionId);
    if (!question) throw new Error("Question not found");
    assertOrgAdmin(ctx.user, question.organizationId);
    await ctx.db.patch(questionId, updates);
  },
});

export const importFromModuleQuestion = adminMutation({
  args: {
    programId: v.id("trainingPrograms"),
    organizationId: v.id("organizations"),
    moduleQuestionId: v.id("examQuestions"),
  },
  handler: async (ctx, args) => {
    assertOrgAdmin(ctx.user, args.organizationId);
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

export const deleteQuestion = adminMutation({
  args: { questionId: v.id("generalExamQuestions") },
  handler: async (ctx, { questionId }) => {
    const question = await ctx.db.get(questionId);
    if (!question) throw new Error("Question not found");
    assertOrgAdmin(ctx.user, question.organizationId);
    await ctx.db.delete(questionId);
  },
});

export const getSettings = authedQuery({
  args: { programId: v.id("trainingPrograms") },
  handler: async (ctx, { programId }) => {
    const program = await ctx.db.get(programId);
    if (!program) return null;
    const user = ctx.user;
    if (program.organizationId !== user.organizationId) {
      throw new Error("Unauthorized");
    }
    return ctx.db
      .query("generalExamSettings")
      .withIndex("by_program", (q) => q.eq("programId", programId))
      .unique();
  },
});

export const upsertSettings = adminMutation({
  args: {
    programId: v.id("trainingPrograms"),
    organizationId: v.id("organizations"),
    timeLimitMinutes: v.optional(v.number()),
    showCorrectAnswers: v.boolean(),
    allowReview: v.boolean(),
    randomizeQuestions: v.boolean(),
  },
  handler: async (ctx, args) => {
    assertOrgAdmin(ctx.user, args.organizationId);
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

export const getAttempts = authedQuery({
  args: {
    programId: v.id("trainingPrograms"),
  },
  handler: async (ctx, { programId }) => {
    const user = ctx.user;
    const program = await ctx.db.get(programId);
    if (!program || program.organizationId !== user.organizationId) {
      throw new Error("Unauthorized");
    }
    return ctx.db
      .query("generalExamAttempts")
      .withIndex("by_user_program", (q) =>
        q.eq("userId", user._id).eq("programId", programId)
      )
      .collect();
  },
});

export const startAttempt = authedMutation({
  args: {
    programId: v.id("trainingPrograms"),
    organizationId: v.id("organizations"),
    attemptNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const user = ctx.user;
    assertOrgMember(user, args.organizationId);
    return ctx.db.insert("generalExamAttempts", {
      userId: user._id,
      programId: args.programId,
      organizationId: args.organizationId,
      attemptNumber: args.attemptNumber,
      answers: [],
      startedAt: Date.now(),
    });
  },
});

export const submitAttempt = authedMutation({
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
    const user = ctx.user;
    const attempt = await ctx.db.get(attemptId);
    if (!attempt || attempt.userId !== user._id) {
      throw new Error("Unauthorized");
    }

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
