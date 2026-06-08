import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useConvexSession } from "./useConvexSession";
import { LEADERBOARD_PERIODS } from "../lib/leaderboard/constants";

/**
 * Organization leaderboard for learners, admins, and leads.
 */
export function useOrgLeaderboard(options = {}) {
  const {
    initialPeriod = LEADERBOARD_PERIODS.WEEK,
    programId,
    learnerCategoryKey,
  } = options;
  const { convexUser } = useConvexSession();
  const [period, setPeriod] = useState(initialPeriod);

  const data = useQuery(
    api.leaderboard.getOrgLeaderboard,
    convexUser?.organizationId
      ? {
          organizationId: convexUser.organizationId,
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
