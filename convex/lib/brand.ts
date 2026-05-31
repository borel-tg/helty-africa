/**
 * Server-side brand (emails, seed demo accounts).
 * Keep in sync with `src/lib/brand.js`.
 */
export const APP_BRAND_NAME = "Helty Africa";
export const APP_DEMO_EMAIL_DOMAIN = "helty.africa";

export function demoAccountEmail(localPart: string) {
  return `${localPart}@${APP_DEMO_EMAIL_DOMAIN}`;
}

export function getDefaultResendFrom() {
  return `${APP_BRAND_NAME} <onboarding@resend.dev>`;
}
