import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

async function resolveStorageUrl(
  ctx: Ctx,
  storageId: Doc<"certificateTemplates">["logoStorageId"],
  fallbackUrl?: string | null
) {
  if (storageId) {
    const url = await ctx.storage.getUrl(storageId);
    if (url) return url;
  }
  return fallbackUrl ?? null;
}

/** Resolve fresh public URLs for template images (storage IDs are source of truth). */
export async function enrichCertificateTemplate(
  ctx: Ctx,
  template: Doc<"certificateTemplates"> | null
) {
  if (!template) return null;

  const [
    logoUrl,
    secondLogoUrl,
    thirdLogoUrl,
    signatureImageUrl,
    signature2ImageUrl,
    signature3ImageUrl,
    backgroundImageUrl,
  ] = await Promise.all([
    resolveStorageUrl(ctx, template.logoStorageId, template.logoUrl),
    resolveStorageUrl(ctx, template.secondLogoStorageId, template.secondLogoUrl),
    resolveStorageUrl(ctx, template.thirdLogoStorageId, template.thirdLogoUrl),
    resolveStorageUrl(
      ctx,
      template.signatureImageStorageId,
      template.signatureImageUrl
    ),
    resolveStorageUrl(
      ctx,
      template.signature2ImageStorageId,
      template.signature2ImageUrl
    ),
    resolveStorageUrl(
      ctx,
      template.signature3ImageStorageId,
      template.signature3ImageUrl
    ),
    resolveStorageUrl(
      ctx,
      template.backgroundImageStorageId,
      template.backgroundImageUrl
    ),
  ]);

  return {
    ...template,
    logoUrl,
    secondLogoUrl,
    thirdLogoUrl,
    signatureImageUrl,
    signature2ImageUrl,
    signature3ImageUrl,
    backgroundImageUrl,
  };
}
