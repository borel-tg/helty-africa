/** DR Congo (Kinshasa) — mobile numbers use +243 then 9 digits. */

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
  if (!d) return null;

  if (d.startsWith("243")) {
    let national = d.slice(3);
    if (national.startsWith("0")) national = national.slice(1);
    national = national.slice(0, 9);
    if (national.length !== 9) return null;
    return `${DRC_COUNTRY_CODE}${national}`;
  }

  // Local national number only (no foreign country code prefix)
  if (d.length <= 10) {
    let national = d.startsWith("0") ? d.slice(1) : d;
    national = national.slice(0, 9);
    if (national.length !== 9) return null;
    return `${DRC_COUNTRY_CODE}${national}`;
  }

  return null;
}

/** Valid when exactly 9 digits after +243 (matches UI error message). */
export function isValidDrcPhone(input) {
  const normalized = normalizeDrcPhone(input);
  if (!normalized) return false;
  return /^\+243\d{9}$/.test(normalized);
}

/**
 * Format while typing. Only rewrites values that are (or can become) a DRC number.
 * Foreign / legacy numbers are left as-is so we don't show a fake +243 prefix.
 */
export function formatDrcPhoneInput(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return DRC_COUNTRY_CODE + " ";

  const normalized = normalizeDrcPhone(trimmed);
  if (normalized) {
    return formatDrcPhone(normalized.replace(/\D/g, ""));
  }

  const d = trimmed.replace(/\D/g, "");
  if (d.startsWith("243")) {
    return formatDrcPhone(d);
  }

  // Local digits only (user typing without country code)
  if (d.length > 0 && d.length <= 9) {
    return formatDrcPhone(d);
  }

  return trimmed;
}

/** Load phone from DB into the input without mangling non-DRC stored values. */
export function formatStoredDrcPhone(stored) {
  if (!stored?.trim()) return DRC_COUNTRY_CODE + " ";
  if (normalizeDrcPhone(stored)) {
    return formatDrcPhoneInput(stored);
  }
  return stored.trim();
}
