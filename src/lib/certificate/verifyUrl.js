/** Normalize certificate ref from URL (trim, collapse spaces, uppercase). */
export function normalizeCertificateNumber(value) {
  if (!value) return "";
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

/** Public verification page URL for a certificate number. */
export function buildCertificateVerifyUrl(certificateNumber, origin) {
  const base = (origin || window.location.origin).replace(/\/$/, "");
  const ref = normalizeCertificateNumber(certificateNumber);
  return `${base}/verify/${encodeURIComponent(ref)}`;
}

const LOG_PREFIX = "[verify-certificate]";

export function logVerifyDebug(step, details = {}) {
  const payload = {
    step,
    at: new Date().toISOString(),
    ...details,
  };
  console.info(LOG_PREFIX, payload);
}

export function getConvexUrlForDebug() {
  const url = import.meta.env.VITE_CONVEX_URL;
  if (!url) return { configured: false, url: null, isPlaceholder: true };
  return {
    configured: true,
    url,
    isPlaceholder: url.includes("placeholder.convex.cloud"),
  };
}
