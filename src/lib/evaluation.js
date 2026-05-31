/** Client-side evaluation helpers (mirrors convex/lib/evaluation.ts). */

export const DEFAULT_EVALUATION_POLICY = {
  programPassThreshold: 80,
  moduleExamWeight: 70,
  generalExamWeight: 30,
  generalExamEnabled: true,
  generalExamMaxRetakes: 3,
  unlockGeneralExamMode: "all_module_attempts",
};

export function roundScore1(value) {
  return Math.round(value * 10) / 10;
}

export function average(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function computeFinalScore(policy, moduleBestScores, generalBestScore) {
  const moduleAvg = average(moduleBestScores);

  if (!policy.generalExamEnabled) {
    return roundScore1(moduleAvg);
  }

  const modW = policy.moduleExamWeight / 100;
  const genW = policy.generalExamWeight / 100;
  const gen = generalBestScore ?? 0;
  return roundScore1(modW * moduleAvg + genW * gen);
}

export function canUnlockGeneralExam(policy, moduleSummaries) {
  if (!moduleSummaries?.length) return false;
  if (policy.unlockGeneralExamMode === "all_module_passes") {
    return moduleSummaries.every((m) => m.passed && m.hasSubmittedAttempt);
  }
  return moduleSummaries.every((m) => m.hasSubmittedAttempt);
}

export function projectFinalScore(
  policy,
  moduleBestScores,
  hypotheticalGeneralScore
) {
  const scores = [...moduleBestScores];
  const gen =
    policy.generalExamEnabled && hypotheticalGeneralScore != null
      ? hypotheticalGeneralScore
      : null;
  return computeFinalScore(policy, scores, gen);
}
