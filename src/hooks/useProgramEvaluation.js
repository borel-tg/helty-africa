import { useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "./useAuth";
import { useConvexSession } from "./useConvexSession";
import {
  MOCK_TRAINING_PROGRAM,
  MOCK_MODULES,
  MOCK_PROGRAM_EXAM_BEST,
  MOCK_GENERAL_EXAM_BEST,
  MOCK_PROGRAM_ENROLLMENTS,
  MOCK_PROGRAM_CERTIFICATES,
  MOCK_GENERAL_EXAM_QUESTIONS,
} from "../lib/mockData";
import {
  computeFinalScore,
  canUnlockGeneralExam,
  DEFAULT_EVALUATION_POLICY,
} from "../lib/evaluation";

const MOCK_PROGRAM_ID = "prog1";

/** Convex returns `enrollment`; mock uses `enrolled` — normalize for UI. */
export function normalizeLearnerEvaluation(raw) {
  if (!raw) return null;
  return {
    ...raw,
    enrolled: raw.enrolled ?? Boolean(raw.enrollment),
  };
}

function buildMockEvaluation(userId, program = MOCK_TRAINING_PROGRAM) {
  const moduleIds = program.moduleIds ?? [];
  const modules = moduleIds
    .map((id) => MOCK_MODULES.find((m) => m._id === id))
    .filter(Boolean);

  const bests = MOCK_PROGRAM_EXAM_BEST[userId] ?? {};
  const moduleSummaries = modules.map((mod) => {
    const best = bests[mod._id];
    return {
      moduleId: mod._id,
      bestScore: best ?? null,
      passed: best != null && best >= mod.passingScore,
      hasSubmittedAttempt: best != null,
    };
  });

  const policy = program.evaluationPolicy ?? DEFAULT_EVALUATION_POLICY;
  const moduleBestScores = moduleSummaries
    .map((m) => m.bestScore)
    .filter((s) => s != null);
  const bestGeneral = MOCK_GENERAL_EXAM_BEST[userId] ?? null;
  const finalScore = computeFinalScore(
    policy,
    moduleBestScores,
    policy.generalExamEnabled ? bestGeneral : null
  );
  const passed = finalScore >= policy.programPassThreshold;
  const generalUnlocked = canUnlockGeneralExam(policy, moduleSummaries);
  const enrolled = (MOCK_PROGRAM_ENROLLMENTS[userId] ?? []).includes(
    program._id
  );
  const cert = MOCK_PROGRAM_CERTIFICATES[userId];

  return {
    program,
    policy,
    modules: modules.map((mod, i) => ({
      ...mod,
      examSummary: moduleSummaries[i],
    })),
    moduleSummaries,
    bestGeneralScore: bestGeneral,
    finalScore,
    passed,
    generalUnlocked,
    generalExamEnabled: policy.generalExamEnabled,
    programCompleted: Boolean(cert?.issuedAt),
    enrolled,
    enrollment: enrolled ? { enrolledAt: Date.now() } : null,
    certificate: cert,
    isMock: true,
  };
}

export function useProgramEvaluation(programId) {
  const { currentUser } = useAuth();
  const { convexUser, userLookup, convexUserMissing } = useConvexSession();
  const enroll = useMutation(api.trainingPrograms.enroll);
  const finalize = useMutation(api.trainingPrograms.finalizeProgramEvaluation);

  const isMockProgram =
    !programId || programId === MOCK_PROGRAM_ID || programId.startsWith("prog");

  const needsConvexUser =
    !isMockProgram && Boolean(currentUser?.email);

  const convexEval = useQuery(
    api.trainingPrograms.getLearnerEvaluation,
    convexUser?._id && programId && !isMockProgram
      ? { programId, userId: convexUser._id }
      : "skip"
  );

  const mockEval = useMemo(() => {
    if (!currentUser?._id || !isMockProgram) return null;
    return buildMockEvaluation(currentUser._id);
  }, [currentUser?._id, isMockProgram]);

  const evaluation = useMemo(() => {
    const raw = convexEval ?? mockEval;
    return normalizeLearnerEvaluation(raw);
  }, [convexEval, mockEval]);

  const isLoading =
    needsConvexUser &&
    (userLookup === "loading" ||
      (userLookup === "ok" &&
        convexUser?._id &&
        convexEval === undefined));

  const sessionBlocked =
    needsConvexUser && userLookup === "ok" && (convexUserMissing || !convexUser);

  const handleEnroll = async () => {
    if (!convexUser?._id || !programId || isMockProgram) {
      throw new Error("Cannot enroll: session not ready");
    }
    await enroll({
      userId: convexUser._id,
      programId,
      organizationId: convexUser.organizationId,
    });
  };

  const handleFinalize = async () => {
    if (convexUser?._id && programId && !isMockProgram) {
      return finalize({ userId: convexUser._id, programId });
    }
    return { finalScore: evaluation?.finalScore, passed: evaluation?.passed };
  };

  return {
    evaluation,
    isLoading,
    sessionBlocked,
    isMock: isMockProgram,
    handleEnroll,
    handleFinalize,
    mockGeneralQuestions: MOCK_GENERAL_EXAM_QUESTIONS,
  };
}

export function useAvailablePrograms() {
  const { currentUser } = useAuth();
  const { convexUser, userLookup } = useConvexSession();

  const programsQueryEnabled = Boolean(
    convexUser?._id && convexUser?.organizationId
  );

  const convexPrograms = useQuery(
    api.trainingPrograms.listAvailableForLearner,
    programsQueryEnabled
      ? {
          organizationId: convexUser.organizationId,
          userId: convexUser._id,
        }
      : "skip"
  );

  const mockPrograms = useMemo(() => {
    if (!currentUser) return [];
    const enrolled = (MOCK_PROGRAM_ENROLLMENTS[currentUser._id] ?? []).includes(
      MOCK_TRAINING_PROGRAM._id
    );
    return [
      {
        ...MOCK_TRAINING_PROGRAM,
        moduleCount: MOCK_TRAINING_PROGRAM.moduleIds.length,
        enrolled,
        canJoin: !enrolled && MOCK_TRAINING_PROGRAM.accessMode === "open",
      },
    ];
  }, [currentUser]);

  // Only block the UI while resolving mock email → Convex user (not while programs load)
  const isLoading = Boolean(currentUser?.email) && userLookup === "loading";

  if (programsQueryEnabled && convexPrograms !== undefined) {
    return { programs: convexPrograms, isMock: false, isLoading: false };
  }

  if (userLookup === "ok" || !currentUser?.email) {
    if (convexUser) {
      return {
        programs: convexPrograms ?? [],
        isMock: false,
        isLoading: false,
      };
    }
    return { programs: mockPrograms, isMock: true, isLoading: false };
  }

  return { programs: [], isMock: false, isLoading };
}
