import { APP_SUPPORT_EMAIL } from "./brand";

/** Support desk contact details — override via VITE_* env vars in .env.local */
export const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL || APP_SUPPORT_EMAIL;

export const SUPPORT_PHONE =
  import.meta.env.VITE_SUPPORT_PHONE || "+233 20 000 0002";

export const SUPPORT_WHATSAPP =
  import.meta.env.VITE_SUPPORT_WHATSAPP || "+233 20 000 0002";

/** Digits only, for wa.me links */
export function phoneToWhatsAppUrl(phone) {
  const digits = String(phone).replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}

export function phoneToTelUrl(phone) {
  const digits = String(phone).replace(/\D/g, "");
  return digits ? `tel:+${digits}` : "#";
}
