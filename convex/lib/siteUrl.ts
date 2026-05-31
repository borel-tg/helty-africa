/** Public app URL for invitation links (set SITE_URL in Convex dashboard). */
export function getSiteUrl(): string {
  const url =
    process.env.SITE_URL?.trim() ||
    process.env.VITE_SITE_URL?.trim() ||
    "http://localhost:5173";
  return url.replace(/\/$/, "");
}

export function buildRegisterUrl(token: string): string {
  return `${getSiteUrl()}/register?token=${encodeURIComponent(token)}`;
}
