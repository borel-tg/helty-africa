import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useConvexSession } from "./useConvexSession";

/** Recently opened modules for the learner home "Continue learning" section. */
export function useRecentModules(_enrolledPrograms, limit = 3) {
  const { convexUser } = useConvexSession();

  const convexRecent = useQuery(
    api.recentModules.listForLearner,
    convexUser?._id ? { limit } : "skip"
  );

  return {
    recentModules: convexRecent ?? [],
    isLoading: convexUser?._id ? convexRecent === undefined : false,
  };
}
