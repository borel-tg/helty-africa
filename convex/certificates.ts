import {
  adminMutation,
  authedMutation,
  authedQuery,
  publicQuery,
} from "./lib/functions";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { enrichCertificateTemplate } from "./lib/certificateTemplate";
import { assertOrgAdmin, assertOrgMember } from "./lib/requireAuth";

const nullableString = v.optional(v.union(v.string(), v.null()));
const nullableStorageId = v.optional(v.union(v.id("_storage"), v.null()));

type TemplateUpsertArgs = {
  layoutId?: "classic" | "premium";
  organizationName: string;
  programSubtitle?: string | null;
  logoUrl?: string | null;
  logoStorageId?: Id<"_storage"> | null;
  secondLogoUrl?: string | null;
  secondLogoStorageId?: Id<"_storage"> | null;
  thirdLogoUrl?: string | null;
  thirdLogoStorageId?: Id<"_storage"> | null;
  logoScale?: number | null;
  secondLogoScale?: number | null;
  thirdLogoScale?: number | null;
  signatureLine?: string | null;
  signature2Line?: string | null;
  signature3Line?: string | null;
  signatureImageUrl?: string | null;
  signatureImageStorageId?: Id<"_storage"> | null;
  signature2ImageUrl?: string | null;
  signature2ImageStorageId?: Id<"_storage"> | null;
  signature3ImageUrl?: string | null;
  signature3ImageStorageId?: Id<"_storage"> | null;
  borderColor: string;
  accentColor?: string | null;
  backgroundImageUrl?: string | null;
  backgroundImageStorageId?: Id<"_storage"> | null;
  footerText?: string | null;
};

function buildTemplateFields(args: TemplateUpsertArgs) {
  const fields: Record<string, unknown> = {
    organizationName: args.organizationName.trim(),
    borderColor: args.borderColor,
  };

  const assign = (key: string, value: unknown) => {
    if (value === null) fields[key] = undefined;
    else if (value !== undefined) fields[key] = value;
  };

  assign("layoutId", args.layoutId);
  assign("programSubtitle", args.programSubtitle?.trim() || null);
  assign("signatureLine", args.signatureLine?.trim() || null);
  assign("signature2Line", args.signature2Line?.trim() || null);
  assign("signature3Line", args.signature3Line?.trim() || null);
  assign("accentColor", args.accentColor || null);
  assign("footerText", args.footerText?.trim() || null);

  assign("logoUrl", args.logoUrl ?? null);
  assign("logoStorageId", args.logoStorageId ?? null);
  assign("secondLogoUrl", args.secondLogoUrl ?? null);
  assign("secondLogoStorageId", args.secondLogoStorageId ?? null);
  assign("thirdLogoUrl", args.thirdLogoUrl ?? null);
  assign("thirdLogoStorageId", args.thirdLogoStorageId ?? null);
  assign("logoScale", args.logoScale ?? null);
  assign("secondLogoScale", args.secondLogoScale ?? null);
  assign("thirdLogoScale", args.thirdLogoScale ?? null);
  assign("signatureImageUrl", args.signatureImageUrl ?? null);
  assign("signatureImageStorageId", args.signatureImageStorageId ?? null);
  assign("signature2ImageUrl", args.signature2ImageUrl ?? null);
  assign("signature2ImageStorageId", args.signature2ImageStorageId ?? null);
  assign("signature3ImageUrl", args.signature3ImageUrl ?? null);
  assign("signature3ImageStorageId", args.signature3ImageStorageId ?? null);
  assign("backgroundImageUrl", args.backgroundImageUrl ?? null);
  assign("backgroundImageStorageId", args.backgroundImageStorageId ?? null);

  return fields;
}

function generateCertificateNumber() {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `EVT-${year}-${suffix}`;
}

function normalizeCertificateRef(certificateNumber: string) {
  return certificateNumber.trim().replace(/\s+/g, "").toUpperCase();
}

async function findCertificateByNumber(ctx: QueryCtx, certificateNumber: string) {
  const normalized = normalizeCertificateRef(certificateNumber);
  const cert = await ctx.db
    .query("certificates")
    .withIndex("by_certificate_number", (q) =>
      q.eq("certificateNumber", normalized)
    )
    .unique();
  return { cert, normalized };
}

/** Fast public verification — no template image URL resolution. */
export const verifyByNumber = publicQuery({
  args: { certificateNumber: v.string() },
  handler: async (ctx, { certificateNumber }) => {
    const { cert, normalized } = await findCertificateByNumber(
      ctx,
      certificateNumber
    );

    console.log("[certificates.verifyByNumber]", {
      normalized,
      found: cert != null,
      certificateId: cert?._id ?? null,
    });

    if (!cert) return null;

    const [user, program, legacyModule, organization, rawTemplate] =
      await Promise.all([
        ctx.db.get(cert.userId),
        cert.programId ? ctx.db.get(cert.programId) : null,
        cert.moduleId ? ctx.db.get(cert.moduleId) : null,
        ctx.db.get(cert.organizationId),
        ctx.db
          .query("certificateTemplates")
          .withIndex("by_org", (q) => q.eq("organizationId", cert.organizationId))
          .unique(),
      ]);

    return {
      certificate: cert,
      learnerName: user?.name ?? "—",
      moduleTitle: program?.title ?? legacyModule?.title ?? "—",
      organizationName:
        rawTemplate?.organizationName ?? organization?.name ?? "—",
      organizationId: cert.organizationId,
    };
  },
});

export const getForUserProgram = authedQuery({
  args: { programId: v.id("trainingPrograms") },
  handler: async (ctx, { programId }) => {
    const user = ctx.user;
    const cert = await ctx.db
      .query("certificates")
      .withIndex("by_user_program", (q) =>
        q.eq("userId", user._id).eq("programId", programId)
      )
      .unique();
    return cert?.programId ? cert : null;
  },
});

export const getById = authedQuery({
  args: { certificateId: v.id("certificates") },
  handler: async (ctx, { certificateId }) => {
    const actor = ctx.user;
    const cert = await ctx.db.get(certificateId);
    if (!cert) return null;
    if (cert.organizationId !== actor.organizationId) return null;
    if (
      cert.userId !== actor._id &&
      actor.role !== "admin" &&
      actor.role !== "super_admin"
    ) {
      throw new Error("Unauthorized");
    }

    const [learner, program, legacyModule, rawTemplate, organization] =
      await Promise.all([
        ctx.db.get(cert.userId),
        cert.programId ? ctx.db.get(cert.programId) : null,
        cert.moduleId ? ctx.db.get(cert.moduleId) : null,
        ctx.db
          .query("certificateTemplates")
          .withIndex("by_org", (q) => q.eq("organizationId", cert.organizationId))
          .unique(),
        ctx.db.get(cert.organizationId),
      ]);

    const template = await enrichCertificateTemplate(ctx, rawTemplate);

    return {
      certificate: cert,
      learnerName: learner?.name ?? "—",
      programTitle: program?.title ?? legacyModule?.title ?? "—",
      moduleTitle: program?.title ?? legacyModule?.title ?? "—",
      organizationName:
        template?.organizationName ?? organization?.name ?? "—",
      template,
    };
  },
});

export const getByNumber = publicQuery({
  args: { certificateNumber: v.string() },
  handler: async (ctx, { certificateNumber }) => {
    const { cert, normalized } = await findCertificateByNumber(
      ctx,
      certificateNumber
    );

    console.log("[certificates.getByNumber]", { normalized, found: cert != null });

    if (!cert) return null;

    const [user, program, legacyModule, rawTemplate, organization] =
      await Promise.all([
        ctx.db.get(cert.userId),
        cert.programId ? ctx.db.get(cert.programId) : null,
        cert.moduleId ? ctx.db.get(cert.moduleId) : null,
        ctx.db
          .query("certificateTemplates")
          .withIndex("by_org", (q) => q.eq("organizationId", cert.organizationId))
          .unique(),
        ctx.db.get(cert.organizationId),
      ]);

    const template = await enrichCertificateTemplate(ctx, rawTemplate);

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

export const listForUser = authedQuery({
  args: {},
  handler: async (ctx) => {
    const user = ctx.user;
    const certs = await ctx.db
      .query("certificates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
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

export const issue = authedMutation({
  args: {
    programId: v.id("trainingPrograms"),
    organizationId: v.id("organizations"),
    generalExamAttemptId: v.optional(v.id("generalExamAttempts")),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const user = ctx.user;
    assertOrgMember(user, args.organizationId);
    const existing = await ctx.db
      .query("certificates")
      .withIndex("by_user_program", (q) =>
        q.eq("userId", user._id).eq("programId", args.programId)
      )
      .unique();
    if (existing) return existing._id;

    return ctx.db.insert("certificates", {
      userId: user._id,
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

export const getTemplate = publicQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const template = await ctx.db
      .query("certificateTemplates")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .unique();
    return enrichCertificateTemplate(ctx, template);
  },
});

export const upsertTemplate = adminMutation({
  args: {
    organizationId: v.id("organizations"),
    layoutId: v.optional(
      v.union(v.literal("classic"), v.literal("premium"))
    ),
    organizationName: v.string(),
    programSubtitle: nullableString,
    logoUrl: nullableString,
    logoStorageId: nullableStorageId,
    secondLogoUrl: nullableString,
    secondLogoStorageId: nullableStorageId,
    thirdLogoUrl: nullableString,
    thirdLogoStorageId: nullableStorageId,
    logoScale: v.optional(v.union(v.number(), v.null())),
    secondLogoScale: v.optional(v.union(v.number(), v.null())),
    thirdLogoScale: v.optional(v.union(v.number(), v.null())),
    signatureLine: nullableString,
    signature2Line: nullableString,
    signature3Line: nullableString,
    signatureImageUrl: nullableString,
    signatureImageStorageId: nullableStorageId,
    signature2ImageUrl: nullableString,
    signature2ImageStorageId: nullableStorageId,
    signature3ImageUrl: nullableString,
    signature3ImageStorageId: nullableStorageId,
    borderColor: v.string(),
    accentColor: nullableString,
    backgroundImageUrl: nullableString,
    backgroundImageStorageId: nullableStorageId,
    footerText: nullableString,
  },
  handler: async (ctx, args) => {
    assertOrgAdmin(ctx.user, args.organizationId);

    const fields = buildTemplateFields(args);
    const existing = await ctx.db
      .query("certificateTemplates")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...fields,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return ctx.db.insert("certificateTemplates", {
      organizationId: args.organizationId,
      ...fields,
      updatedAt: Date.now(),
    });
  },
});
