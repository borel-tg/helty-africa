import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function generateCertificateNumber() {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `EVT-${year}-${suffix}`;
}

export const getForUserProgram = query({
  args: { userId: v.id("users"), programId: v.id("trainingPrograms") },
  handler: async (ctx, { userId, programId }) => {
    const cert = await ctx.db
      .query("certificates")
      .withIndex("by_user_program", (q) =>
        q.eq("userId", userId).eq("programId", programId)
      )
      .unique();
    return cert?.programId ? cert : null;
  },
});

export const getById = query({
  args: { certificateId: v.id("certificates") },
  handler: async (ctx, { certificateId }) => {
    const cert = await ctx.db.get(certificateId);
    if (!cert) return null;

    const [user, program, legacyModule, template, organization] = await Promise.all([
      ctx.db.get(cert.userId),
      cert.programId ? ctx.db.get(cert.programId) : null,
      cert.moduleId ? ctx.db.get(cert.moduleId) : null,
      ctx.db
        .query("certificateTemplates")
        .withIndex("by_org", (q) => q.eq("organizationId", cert.organizationId))
        .unique(),
      ctx.db.get(cert.organizationId),
    ]);

    return {
      certificate: cert,
      learnerName: user?.name ?? "—",
      programTitle: program?.title ?? legacyModule?.title ?? "—",
      moduleTitle: program?.title ?? legacyModule?.title ?? "—",
      organizationName:
        template?.organizationName ?? organization?.name ?? "—",
      template,
    };
  },
});

export const getByNumber = query({
  args: { certificateNumber: v.string() },
  handler: async (ctx, { certificateNumber }) => {
    const cert = await ctx.db
      .query("certificates")
      .withIndex("by_certificate_number", (q) =>
        q.eq("certificateNumber", certificateNumber)
      )
      .unique();
    if (!cert) return null;

    const [user, program, legacyModule, template, organization] = await Promise.all([
      ctx.db.get(cert.userId),
      cert.programId ? ctx.db.get(cert.programId) : null,
      cert.moduleId ? ctx.db.get(cert.moduleId) : null,
      ctx.db
        .query("certificateTemplates")
        .withIndex("by_org", (q) => q.eq("organizationId", cert.organizationId))
        .unique(),
      ctx.db.get(cert.organizationId),
    ]);

    return {
      certificate: cert,
      learnerName: user?.name ?? "—",
      programTitle: program?.title ?? legacyModule?.title ?? "—",
      moduleTitle: program?.title ?? legacyModule?.title ?? "—",
      organizationName:
        template?.organizationName ?? organization?.name ?? "—",
      template,
    };
  },
});

export const listForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const certs = await ctx.db
      .query("certificates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return Promise.all(
      certs
        .filter((cert) => cert.programId != null)
        .map(async (cert) => {
          const program = cert.programId
            ? await ctx.db.get(cert.programId)
            : null;
          return {
            ...cert,
            programTitle: program?.title ?? "Training program",
            moduleTitle: program?.title ?? "Training program",
          };
        })
    );
  },
});

export const issue = mutation({
  args: {
    userId: v.id("users"),
    programId: v.id("trainingPrograms"),
    organizationId: v.id("organizations"),
    generalExamAttemptId: v.optional(v.id("generalExamAttempts")),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("certificates")
      .withIndex("by_user_program", (q) =>
        q.eq("userId", args.userId).eq("programId", args.programId)
      )
      .unique();
    if (existing) return existing._id;

    return ctx.db.insert("certificates", {
      userId: args.userId,
      programId: args.programId,
      organizationId: args.organizationId,
      generalExamAttemptId: args.generalExamAttemptId,
      score: args.score,
      issuedAt: Date.now(),
      certificateNumber: generateCertificateNumber(),
    });
  },
});

// ── Certificate Templates ──────────────────────────────────────────────────

export const getTemplate = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    return ctx.db
      .query("certificateTemplates")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .unique();
  },
});

export const upsertTemplate = mutation({
  args: {
    organizationId: v.id("organizations"),
    organizationName: v.string(),
    programSubtitle: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    signatureLine: v.optional(v.string()),
    signatureImageUrl: v.optional(v.string()),
    borderColor: v.string(),
    accentColor: v.optional(v.string()),
    backgroundImageUrl: v.optional(v.string()),
    footerText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("certificateTemplates")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
      return existing._id;
    }

    return ctx.db.insert("certificateTemplates", {
      ...args,
      updatedAt: Date.now(),
    });
  },
});
