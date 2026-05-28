/**
 * Leaderboard scoring and visibility rules (mirrored in convex/leaderboard.ts).
 */

/** Points for each lesson marked complete within the period. */
export const POINTS_PER_LESSON = 1;

/** Points for each module passed (exam) within the period — counted once per module. */
export const POINTS_PER_MODULE_PASS = 5;

/** Minimum active learners in the org before the leaderboard is shown. */
export const MIN_LEARNERS_TO_SHOW = 3;

/** Number of top rows fetched and shown when expanded (staff) or fully open (learner). */
export const LEADERBOARD_TOP_LIMIT = 5;

/** Learner dashboard: rows visible before "Voir tout" expand. */
export const LEADERBOARD_COLLAPSED_LIMIT = 2;

/** Period keys used by the UI toggle and API. */
export const LEADERBOARD_PERIODS = {
  WEEK: "week",
  TODAY: "today",
};
