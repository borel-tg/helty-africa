/** Shared evaluation policy defaults and scoring (used by queries/mutations). */

export const DEFAULT_EVALUATION_POLICY = {
  programPassThreshold: 80,
  moduleExamWeight: 70,
  generalExamWeight: 30,
  generalExamEnabled: true,
  generalExamMaxRetakes: 3 as number | "unlimited",
  unlockGeneralExamMode: "all_module_attempts" as
    | "all_module_attempts"
    | "all_module_passes",
};

export type EvaluationPolicy = typeof DEFAULT_EVALUATION_POLICY;

export function roundScore1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function computeFinalScore(
  policy: EvaluationPolicy,
  moduleBestScores: number[],
  generalBestScore: number | null
): number {
  const moduleAvg = average(moduleBestScores);

  if (!policy.generalExamEnabled) {
    return roundScore1(moduleAvg);
  }

  const modW = policy.moduleExamWeight / 100;
  const genW = policy.generalExamWeight / 100;
  const gen = generalBestScore ?? 0;
  return roundScore1(modW * moduleAvg + genW * gen);
}

export type ModuleExamSummary = {
  moduleId: string;
  bestScore: number | null;
  passed: boolean;
  hasSubmittedAttempt: boolean;
  attemptCount: number;
};

export function canUnlockGeneralExam(
  policy: EvaluationPolicy,
  modules: ModuleExamSummary[]
): boolean {
  if (modules.length === 0) return false;

  if (policy.unlockGeneralExamMode === "all_module_passes") {
    return modules.every((m) => m.passed && m.hasSubmittedAttempt);
  }

  return modules.every((m) => m.hasSubmittedAttempt);
}

export function validateEvaluationPolicy(policy: EvaluationPolicy): void {
  if (policy.moduleExamWeight + policy.generalExamWeight !== 100) {
    throw new Error("Module and general exam weights must sum to 100");
  }
  if (policy.programPassThreshold < 0 || policy.programPassThreshold > 100) {
    throw new Error("Pass threshold must be between 0 and 100");
  }
}
