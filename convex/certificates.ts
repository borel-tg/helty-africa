import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function generateCertificateNumber() {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `EVT-${year}-${suffix}`;
}

export const getForUserModule = query({
  args: { userId: v.id("users"), moduleId: v.id("modules") },
  handler: async (ctx, { userId, moduleId }) => {
    return ctx.db
      .query("certificates")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", userId).eq("moduleId", moduleId)
      )
      .unique();
  },
});

export const getById = query({
  args: { certificateId: v.id("certificates") },
  handler: async (ctx, { certificateId }) => {
    const cert = await ctx.db.get(certificateId);
    if (!cert) return null;

    const [user, module, template, organization] = await Promise.all([
      ctx.db.get(cert.userId),
      ctx.db.get(cert.moduleId),
      ctx.db
        .query("certificateTemplates")
        .withIndex("by_org", (q) => q.eq("organizationId", cert.organizationId))
        .unique(),
      ctx.db.get(cert.organizationId),
    ]);

    return {
      certificate: cert,
      learnerName: user?.name ?? "—",
      moduleTitle: module?.title ?? "—",
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

    const [user, module, template, organization] = await Promise.all([
      ctx.db.get(cert.userId),
      ctx.db.get(cert.moduleId),
      ctx.db
        .query("certificateTemplates")
        .withIndex("by_org", (q) => q.eq("organizationId", cert.organizationId))
        .unique(),
      ctx.db.get(cert.organizationId),
    ]);

    return {
      certificate: cert,
      learnerName: user?.name ?? "—",
      moduleTitle: module?.title ?? "—",
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
      certs.map(async (cert) => {
        const module = await ctx.db.get(cert.moduleId);
        return {
          ...cert,
          moduleTitle: module?.title ?? "Training module",
        };
      })
    );
  },
});

export const issue = mutation({
  args: {
    userId: v.id("users"),
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    examAttemptId: v.optional(v.id("examAttempts")),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("certificates")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", args.userId).eq("moduleId", args.moduleId)
      )
      .unique();
    if (existing) return existing._id;

    return ctx.db.insert("certificates", {
      userId: args.userId,
      moduleId: args.moduleId,
      organizationId: args.organizationId,
      examAttemptId: args.examAttemptId,
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
