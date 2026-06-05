/** Certificate layout variants. */
export const CERTIFICATE_LAYOUTS = {
  classic: "classic",
  premium: "premium",
};

/** Default layout — Template 1 (classic). */
export const DEFAULT_LAYOUT_ID = CERTIFICATE_LAYOUTS.classic;

/** Default certificate template when Convex has no saved template. */
export const DEFAULT_CERTIFICATE_TEMPLATE = {
  layoutId: DEFAULT_LAYOUT_ID,
  organizationName: "PolioFree Africa NGO",
  programSubtitle: "Employee Training Programme",
  signatureLine: "Dr. Amara Diallo, Training Director",
  signature2Line: null,
  signatureImageUrl: null,
  signature2ImageUrl: null,
  borderColor: "#2E7D64",
  accentColor: "#2E7D64",
  logoUrl: null,
  secondLogoUrl: null,
  backgroundImageUrl: null,
  footerText:
    "This document certifies completion of the stated training module as recorded in the organization's training system.",
};

export function mergeTemplate(saved) {
  if (!saved) return { ...DEFAULT_CERTIFICATE_TEMPLATE };
  return {
    ...DEFAULT_CERTIFICATE_TEMPLATE,
    ...saved,
    layoutId: saved.layoutId ?? DEFAULT_LAYOUT_ID,
    accentColor:
      saved.accentColor ??
      saved.borderColor ??
      DEFAULT_CERTIFICATE_TEMPLATE.accentColor,
  };
}
