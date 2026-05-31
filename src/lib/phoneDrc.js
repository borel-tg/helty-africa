/** DR Congo (Kinshasa) — mobile numbers use +243 then 9 digits (often 8xx or 9xx). */

export const DRC_COUNTRY_CODE = "+243";

/** Format digits as +243 812 345 678 */
export function formatDrcPhone(digitsOnly) {
  const d = digitsOnly.replace(/\D/g, "");
  let national = d;
  if (national.startsWith("243")) national = national.slice(3);
  if (national.startsWith("0")) national = national.slice(1);
  national = national.slice(0, 9);
  if (national.length === 0) return DRC_COUNTRY_CODE + " ";
  const parts = [];
  for (let i = 0; i < national.length; i += 3) {
    parts.push(national.slice(i, i + 3));
  }
  return `${DRC_COUNTRY_CODE} ${parts.join(" ")}`.trim();
}

/** Parse user input to E.164-style +243XXXXXXXXX */
export function normalizeDrcPhone(input) {
  const d = (input || "").replace(/\D/g, "");
  let national = d;
  if (national.startsWith("243")) national = national.slice(3);
  if (national.startsWith("0")) national = national.slice(1);
  national = national.slice(0, 9);
  if (national.length < 9) return null;
  return `${DRC_COUNTRY_CODE}${national}`;
}

export function isValidDrcPhone(input) {
  const normalized = normalizeDrcPhone(input);
  if (!normalized) return false;
  return /^\+243[89]\d{8}$/.test(normalized);
}

export function formatDrcPhoneInput(value) {
  const d = (value || "").replace(/\D/g, "");
  if (d.length === 0) return DRC_COUNTRY_CODE + " ";
  if (d.startsWith("243")) return formatDrcPhone(d);
  return formatDrcPhone(d);
}
