/** Default certificate template when Convex has no saved template. */
export const DEFAULT_CERTIFICATE_TEMPLATE = {
  organizationName: "PolioFree Africa NGO",
  programSubtitle: "Employee Training Programme",
  signatureLine: "Dr. Amara Diallo, Training Director",
  borderColor: "#2E7D64",
  accentColor: "#2E7D64",
  logoUrl: null,
  signatureImageUrl: null,
  backgroundImageUrl: null,
  footerText:
    "This document certifies completion of the stated training module as recorded in the organization's training system.",
};

export function mergeTemplate(saved) {
  if (!saved) return { ...DEFAULT_CERTIFICATE_TEMPLATE };
  return {
    ...DEFAULT_CERTIFICATE_TEMPLATE,
    ...saved,
    accentColor: saved.accentColor ?? saved.borderColor ?? DEFAULT_CERTIFICATE_TEMPLATE.accentColor,
  };
}
