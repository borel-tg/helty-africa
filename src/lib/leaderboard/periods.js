import { LEADERBOARD_PERIODS } from "./constants";

/**
 * Start timestamp (ms) for the leaderboard window.
 * @param {"week"|"today"} period
 * @param {number} [now] — defaults to Date.now()
 */
export function getPeriodStart(period, now = Date.now()) {
  if (period === LEADERBOARD_PERIODS.TODAY) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  }
  // Rolling last 7 days
  return now - 7 * 24 * 60 * 60 * 1000;
}

export function isValidPeriod(period) {
  return period === LEADERBOARD_PERIODS.WEEK || period === LEADERBOARD_PERIODS.TODAY;
}
