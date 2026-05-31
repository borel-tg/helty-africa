import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "./useAuth";
import { useConvexSession } from "./useConvexSession";
import {
  getRecentModules,
  filterRecentByEnrolled,
  getRecentStorageUserId,
} from "../lib/recentModules";
import { MOCK_MODULES } from "../lib/mockData";

const MAX_SCAN = 10;

/**
 * Recently opened modules for the learner home "Reprendre" section.
 * Convex: fresh from DB, enrolled programs only.
 * Mock: localStorage filtered by current enrollments.
 */
export function useRecentModules(enrolledPrograms, limit = 3) {
  const { currentUser } = useAuth();
  const { convexUser, userLookup } = useConvexSession();

  const convexRecent = useQuery(
    api.recentModules.listForLearner,
    convexUser?._id ? { userId: convexUser._id, limit } : "skip"
  );

  const mockRecent = useMemo(() => {
    const storageId = getRecentStorageUserId(currentUser);
    if (!storageId) return [];
    const raw = getRecentModules(storageId, MAX_SCAN);
    return filterRecentByEnrolled(
      raw,
      enrolledPrograms,
      MOCK_MODULES,
      limit
    );
  }, [currentUser, enrolledPrograms, limit]);

  if (convexUser?._id) {
    return {
      recentModules: convexRecent ?? [],
      isLoading: convexRecent === undefined,
    };
  }

  const isLoading = Boolean(currentUser?.email) && userLookup === "loading";

  return {
    recentModules: mockRecent,
    isLoading,
  };
}
