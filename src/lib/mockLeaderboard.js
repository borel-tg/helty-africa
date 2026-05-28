/**
 * Demo leaderboard data until the learner dashboard reads from Convex.
 * Shape matches convex/leaderboard getOrgLeaderboard return type.
 */

import { formatLearnerDisplayName } from "./leaderboard/displayName";
import {
  LEADERBOARD_TOP_LIMIT,
  MIN_LEARNERS_TO_SHOW,
} from "./leaderboard/constants";
import { getPeriodStart } from "./leaderboard/periods";

/** Simulated scores per period (userId → stats). */
const MOCK_SCORES = {
  week: [
    { userId: "user_learner3", name: "Amina Diallo", points: 12, lessonsCount: 2, modulesPassed: 2 },
    { userId: "user_learner", name: "Fatima Coulibaly", points: 8, lessonsCount: 3, modulesPassed: 1 },
    { userId: "user_learner5", name: "Mariam Keita", points: 7, lessonsCount: 2, modulesPassed: 1 },
    { userId: "user_learner2", name: "Ibrahim Traoré", points: 4, lessonsCount: 4, modulesPassed: 0 },
    { userId: "user_learner6", name: "Ousmane Barry", points: 3, lessonsCount: 3, modulesPassed: 0 },
    { userId: "user_learner7", name: "Aïcha Sow", points: 2, lessonsCount: 2, modulesPassed: 0 },
  ],
  today: [
    { userId: "user_learner", name: "Fatima Coulibaly", points: 5, lessonsCount: 2, modulesPassed: 1 },
    { userId: "user_learner3", name: "Amina Diallo", points: 4, lessonsCount: 1, modulesPassed: 1 },
    { userId: "user_learner5", name: "Mariam Keita", points: 3, lessonsCount: 3, modulesPassed: 0 },
    { userId: "user_learner2", name: "Ibrahim Traoré", points: 1, lessonsCount: 1, modulesPassed: 0 },
    { userId: "user_learner6", name: "Ousmane Barry", points: 1, lessonsCount: 1, modulesPassed: 0 },
    { userId: "user_learner7", name: "Aïcha Sow", points: 0, lessonsCount: 0, modulesPassed: 0 },
  ],
};

function assignRanks(sorted) {
  let rank = 0;
  let prevPoints = null;
  return sorted.map((entry, index) => {
    if (prevPoints !== entry.points) {
      rank = index + 1;
      prevPoints = entry.points;
    }
    return { ...entry, rank };
  });
}

/**
 * @param {"week"|"today"} period
 * @param {string} viewerUserId
 * @param {string} organizationId
 */
export function getMockOrgLeaderboard(period, viewerUserId, organizationId) {
  const since = getPeriodStart(period);
  const raw = [...(MOCK_SCORES[period] ?? MOCK_SCORES.week)];
  raw.sort((a, b) => b.points - a.points);

  const ranked = assignRanks(
    raw.map((row) => ({
      ...row,
      displayName: formatLearnerDisplayName(row.name),
      latestActivity: Date.now(),
    }))
  );

  const totalActiveLearners = ranked.length;
  const withActivity = ranked.filter((r) => r.points > 0);

  const viewerRow = viewerUserId
    ? ranked.find((r) => r.userId === viewerUserId)
    : null;
  const viewerRankIndex = viewerUserId
    ? ranked.findIndex((r) => r.userId === viewerUserId)
    : -1;
  const viewerRank = viewerRankIndex >= 0 ? viewerRankIndex + 1 : null;

  const hidden =
    totalActiveLearners < MIN_LEARNERS_TO_SHOW ||
    withActivity.length < MIN_LEARNERS_TO_SHOW;

  return {
    period,
    since,
    organizationId,
    totalActiveLearners,
    minLearnersRequired: MIN_LEARNERS_TO_SHOW,
    hidden,
    entries: ranked.slice(0, LEADERBOARD_TOP_LIMIT).map((e) => ({
      rank: e.rank,
      userId: e.userId,
      displayName: e.displayName,
      points: e.points,
      lessonsCount: e.lessonsCount,
      modulesPassed: e.modulesPassed,
    })),
    viewer: viewerRow
      ? {
          rank: viewerRank,
          userId: viewerRow.userId,
          displayName: viewerRow.displayName,
          points: viewerRow.points,
          lessonsCount: viewerRow.lessonsCount,
          modulesPassed: viewerRow.modulesPassed,
          inTop: viewerRank !== null && viewerRank <= LEADERBOARD_TOP_LIMIT,
        }
      : null,
  };
}
