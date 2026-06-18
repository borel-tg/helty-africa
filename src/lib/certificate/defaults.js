/** Default logo size as a percentage (50–200). 100 = base size. */
export const DEFAULT_LOGO_SCALE = 100;
export const LOGO_SCALE_MIN = 50;
export const LOGO_SCALE_MAX = 200;

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
  programSubtitle: "Programme de formation des employés",
  signatureLine: "Dr Amara Diallo, Directrice de la formation",
  signature2Line: null,
  signature3Line: null,
  signatureImageUrl: null,
  signature2ImageUrl: null,
  signature3ImageUrl: null,
  borderColor: "#2E7D64",
  accentColor: "#2E7D64",
  logoUrl: null,
  secondLogoUrl: null,
  thirdLogoUrl: null,
  logoScale: DEFAULT_LOGO_SCALE,
  secondLogoScale: DEFAULT_LOGO_SCALE,
  thirdLogoScale: DEFAULT_LOGO_SCALE,
  backgroundImageUrl: null,
  footerText:
    "Ce document atteste de la réussite du module de formation indiqué, tel qu'enregistré dans le système de formation de l'organisation.",
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
    logoScale: saved.logoScale ?? DEFAULT_LOGO_SCALE,
    secondLogoScale: saved.secondLogoScale ?? DEFAULT_LOGO_SCALE,
    thirdLogoScale: saved.thirdLogoScale ?? DEFAULT_LOGO_SCALE,
  };
}
