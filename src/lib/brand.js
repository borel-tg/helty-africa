/**
 * Application brand — change values here to rebrand the UI.
 * Keep `convex/lib/brand.ts` in sync for invitation emails (Convex backend).
 */
export const APP_BRAND_NAME = "COUP RDC";
export const APP_BRAND_SHORT_NAME = "COUP RDC";
export const APP_BRAND_INITIAL = "C";

/** Browser tab / PWA default page title suffix */
export const APP_PAGE_SUBTITLE = "Formation à la vaccination Polio";

export const APP_CONTACT_EMAIL = "contact@helty.africa";
export const APP_SUPPORT_EMAIL = "tchassemborel@gmail.com";

/** Domain used for seeded / demo login accounts only */
export const APP_DEMO_EMAIL_DOMAIN = "helty.africa";

export function demoAccountEmail(localPart) {
  return `${localPart}@${APP_DEMO_EMAIL_DOMAIN}`;
}

export function getAppPageTitle(subtitle = APP_PAGE_SUBTITLE) {
  return `${APP_BRAND_NAME} – ${subtitle}`;
}

export function getDefaultResendFrom() {
  return `${APP_BRAND_NAME} <onboarding@resend.dev>`;
}
