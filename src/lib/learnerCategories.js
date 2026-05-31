/** Labels for learner category (French app — keys used in DB / stats). */
export const LEARNER_CATEGORIES = [
  { key: "national", labelFr: "National", labelEn: "National" },
  { key: "provincial", labelFr: "Provincial", labelEn: "Provincial" },
  { key: "zonal", labelFr: "Zonal", labelEn: "Zonal" },
];

export function getLearnerCategoryLabel(key, lang = "fr") {
  const row = LEARNER_CATEGORIES.find((c) => c.key === key);
  if (!row) return key ?? "—";
  return lang === "en" ? row.labelEn : row.labelFr;
}
