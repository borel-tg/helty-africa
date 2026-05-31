import { useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useConvexSession } from "./useConvexSession";

/** Convex returns `enrollment`; UI uses `enrolled` — normalize for display. */
export function normalizeLearnerEvaluation(raw) {
  if (!raw) return null;
  return {
    ...raw,
    enrolled: raw.enrolled ?? Boolean(raw.enrollment),
  };
}

export function useProgramEvaluation(programId) {
  const { convexUser } = useConvexSession();
  const enroll = useMutation(api.trainingPrograms.enroll);
  const finalize = useMutation(api.trainingPrograms.finalizeProgramEvaluation);

  const convexEval = useQuery(
    api.trainingPrograms.getLearnerEvaluation,
    convexUser?._id && programId
      ? { programId, userId: convexUser._id }
      : "skip"
  );

  const evaluation = useMemo(
    () => normalizeLearnerEvaluation(convexEval),
    [convexEval]
  );

  const isLoading = Boolean(
    convexUser?._id && programId && convexEval === undefined
  );

  const sessionBlocked = Boolean(programId && !convexUser?._id);

  const handleEnroll = async () => {
    if (!convexUser?._id || !programId) {
      throw new Error("Cannot enroll: session not ready");
    }
    await enroll({
      userId: convexUser._id,
      programId,
      organizationId: convexUser.organizationId,
    });
  };

  const handleFinalize = async () => {
    if (!convexUser?._id || !programId) {
      throw new Error("Cannot finalize: session not ready");
    }
    return finalize({ userId: convexUser._id, programId });
  };

  return {
    evaluation,
    isLoading,
    sessionBlocked,
    handleEnroll,
    handleFinalize,
  };
}

export function useAvailablePrograms() {
  const { convexUser } = useConvexSession();

  const convexPrograms = useQuery(
    api.trainingPrograms.listAvailableForLearner,
    convexUser?._id && convexUser?.organizationId
      ? {
          organizationId: convexUser.organizationId,
          userId: convexUser._id,
        }
      : "skip"
  );

  const isLoading = Boolean(
    convexUser?._id && convexPrograms === undefined
  );

  return {
    programs: convexPrograms ?? [],
    isLoading,
  };
}
