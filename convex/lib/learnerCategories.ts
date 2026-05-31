import { v } from "convex/values";

/** Stable keys for stats — labels live in app i18n (French primary). */
export const LEARNER_CATEGORY_KEYS = [
  "national",
  "provincial",
  "zonal",
] as const;

export type LearnerCategoryKey = (typeof LEARNER_CATEGORY_KEYS)[number];

export const learnerCategoryKeyValidator = v.union(
  v.literal("national"),
  v.literal("provincial"),
  v.literal("zonal")
);

export function isLearnerCategoryKey(
  value: string | undefined
): value is LearnerCategoryKey {
  return (
    value !== undefined &&
    (LEARNER_CATEGORY_KEYS as readonly string[]).includes(value)
  );
}
