import { useMemo, useState } from "react";
import { useAuth } from "./useAuth";
import { LEADERBOARD_PERIODS } from "../lib/leaderboard/constants";
import { getMockOrgLeaderboard } from "../lib/mockLeaderboard";

/**
 * Organization leaderboard (learners, admins, leads).
 *
 * @param {object} [options]
 * @param {boolean} [options.highlightViewer=true] — false for admin/lead staff views
 * @param {"week"|"today"} [options.initialPeriod]
 *
 * When Convex auth is wired, swap the body for:
 *   useQuery(api.leaderboard.getOrgLeaderboard, { organizationId, viewerUserId, period })
 */
export function useOrgLeaderboard(options = {}) {
  const { highlightViewer = true, initialPeriod = LEADERBOARD_PERIODS.WEEK } = options;
  const { currentUser } = useAuth();
  const [period, setPeriod] = useState(initialPeriod);

  const viewerUserId =
    highlightViewer && currentUser?.role === "learner" ? currentUser._id : null;

  const data = useMemo(() => {
    if (!currentUser?.organizationId) {
      return null;
    }
    return getMockOrgLeaderboard(
      period,
      viewerUserId,
      currentUser.organizationId
    );
  }, [period, viewerUserId, currentUser?.organizationId]);

  return {
    period,
    setPeriod,
    data,
    isLoading: false,
  };
}
