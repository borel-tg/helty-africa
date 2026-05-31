import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "./useAuth";
import { useConvexSession } from "./useConvexSession";
import { LEADERBOARD_PERIODS } from "../lib/leaderboard/constants";

/**
 * Organization leaderboard for learners, admins, and leads.
 */
export function useOrgLeaderboard(options = {}) {
  const {
    highlightViewer = true,
    initialPeriod = LEADERBOARD_PERIODS.WEEK,
    programId,
    learnerCategoryKey,
  } = options;
  const { currentUser } = useAuth();
  const { convexUser } = useConvexSession();
  const [period, setPeriod] = useState(initialPeriod);

  const viewerUserId =
    highlightViewer && currentUser?.role === "learner"
      ? currentUser._id
      : convexUser?._id;

  const data = useQuery(
    api.leaderboard.getOrgLeaderboard,
    convexUser?.organizationId && viewerUserId
      ? {
          organizationId: convexUser.organizationId,
          viewerUserId,
          period,
          ...(programId ? { programId } : {}),
          ...(learnerCategoryKey ? { learnerCategoryKey } : {}),
        }
      : "skip"
  );

  return {
    period,
    setPeriod,
    data: data ?? null,
    isLoading: Boolean(convexUser?.organizationId && data === undefined),
  };
}
