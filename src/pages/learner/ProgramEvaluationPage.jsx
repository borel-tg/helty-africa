import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Award,
  BookOpen,
  CheckCircle,
  Circle,
  Lock,
  ChevronRight,
  Info,
  XCircle,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Select } from "../../components/ui/Input";
import { ProgressBar } from "../../components/ui/Progress";
import {
  useProgramEvaluation,
  useAvailablePrograms,
} from "../../hooks/useProgramEvaluation";
import { average, roundScore1 } from "../../lib/evaluation";
import { cn } from "../../lib/utils";

function OverviewStat({ label, value, highlight }) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 text-center",
        highlight ? "bg-primary-50 border border-primary-100" : "bg-gray-50",
      )}
    >
      <p className="text-lg font-bold text-text-primary tabular-nums">
        {value}
      </p>
      <p className="text-[10px] sm:text-xs text-text-secondary mt-0.5 leading-tight">
        {label}
      </p>
    </div>
  );
}

export default function ProgramEvaluationPage() {
  const { t } = useTranslation();
  const { programId } = useParams();
  const navigate = useNavigate();
  const { programs } = useAvailablePrograms();
  const {
    evaluation,
    isLoading,
    sessionBlocked,
    handleEnroll,
    handleFinalize,
  } = useProgramEvaluation(programId);

  const [finalizing, setFinalizing] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const enrolledPrograms = (programs ?? []).filter((p) => p.enrolled);

  if (isLoading) {
    return (
      <p className="p-6 text-center text-text-secondary">
        {t("common.loading")}
      </p>
    );
  }

  if (sessionBlocked) {
    return (
      <p className="p-6 text-center text-text-secondary">
        {t("trainings.convexUserRequired")}
      </p>
    );
  }

  if (!evaluation) {
    return (
      <p className="p-6 text-center text-text-secondary">
        {t("evaluation.programNotFound")}
      </p>
    );
  }

  const {
    program,
    policy,
    modules,
    moduleSummaries,
    bestGeneralScore,
    finalScore,
    passed,
    generalUnlocked,
    generalExamEnabled,
    programCompleted,
    enrolled,
    certificate,
    submittedGeneralCount = 0,
  } = evaluation;

  const requireModulePass =
    policy.unlockGeneralExamMode === "all_module_passes";
  const maxFinalRetakes = policy.generalExamMaxRetakes ?? 3;
  const finalRetakesLeft =
    maxFinalRetakes === "unlimited"
      ? Infinity
      : Math.max(0, maxFinalRetakes - submittedGeneralCount);
  const canTakeFinalExam =
    generalExamEnabled && generalUnlocked && finalRetakesLeft > 0;

  const pendingModuleCount = moduleSummaries.filter((m) =>
    requireModulePass
      ? !m.passed || !m.hasSubmittedAttempt
      : !m.hasSubmittedAttempt,
  ).length;
  const modulesSubmitted = moduleSummaries.filter(
    (m) => m.hasSubmittedAttempt,
  ).length;
  const modulesPassed = moduleSummaries.filter((m) => m.passed).length;

  const moduleBestScores = moduleSummaries
    .map((m) => m.bestScore)
    .filter((s) => s != null);
  const moduleAvg =
    moduleBestScores.length > 0 ? roundScore1(average(moduleBestScores)) : null;
  const moduleContribution =
    moduleAvg != null && generalExamEnabled
      ? roundScore1((moduleAvg * policy.moduleExamWeight) / 100)
      : moduleAvg;
  const finalContribution =
    bestGeneralScore != null && generalExamEnabled
      ? roundScore1((bestGeneralScore * policy.generalExamWeight) / 100)
      : null;

  const onJoin = async () => {
    try {
      await handleEnroll();
    } catch {
      /* session not ready */
    }
  };

  const onFinalize = async () => {
    setFinalizing(true);
    try {
      const result = await handleFinalize();
      if (result?.passed) {
        navigate(`/learn/program/${programId}/certificate`);
      }
    } finally {
      setFinalizing(false);
    }
  };

  const canConfirmResult =
    !programCompleted &&
    enrolled &&
    ((!generalExamEnabled &&
      moduleSummaries.every((m) => m.hasSubmittedAttempt)) ||
      (generalExamEnabled && generalUnlocked && bestGeneralScore != null));

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-10">
          {t("routes.evaluation")}
        </h2>
        {enrolledPrograms.length > 1 ? (
          <Select
            label={t("evaluation.selectProgram")}
            value={programId}
            onChange={(e) =>
              navigate(`/learn/program/${e.target.value}/evaluation`)
            }
            className="mt-4 mb-6"
          >
            {enrolledPrograms.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
              </option>
            ))}
          </Select>
        ) : (
          <p className="text-sm text-text-secondary mb-6">{program.title}</p>
        )}
      </div>

      {!enrolled && program.accessMode === "open" && (
        <Card className="p-4 bg-primary-50 border border-primary-100">
          <p className="text-sm text-primary-800 mb-3">
            {t("evaluation.joinPrompt")}
          </p>
          <Button size="sm" onClick={onJoin}>
            {t("evaluation.joinProgram")}
          </Button>
        </Card>
      )}

      {enrolled && (
        <>
          {/* Overview stats — scoped to this program */}
          <Card className="p-5">
            <h2 className="text-base font-semibold text-text-primary mb-4">
              {t("evaluation.statsOverview")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <OverviewStat
                label={t("evaluation.statModuleTestsSubmitted")}
                value={`${modulesSubmitted}/${modules.length}`}
              />
              <OverviewStat
                label={t("evaluation.statModuleTestsPassed")}
                value={`${modulesPassed}/${modules.length}`}
              />
              {generalExamEnabled && (
                <OverviewStat
                  label={t("trainings.statFinalExam")}
                  value={
                    !generalUnlocked
                      ? t("trainings.locked")
                      : bestGeneralScore != null
                        ? `${bestGeneralScore}%`
                        : canTakeFinalExam
                          ? t("trainings.available")
                          : t("trainings.locked")
                  }
                  highlight={canTakeFinalExam && bestGeneralScore == null}
                />
              )}
              <OverviewStat
                label={t("trainings.statFinalScore")}
                value={moduleBestScores.length > 0 ? `${finalScore}%` : "—"}
                highlight={passed && moduleBestScores.length > 0}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary shrink-0">
                {t("evaluation.progressToPass")}
              </span>
              <ProgressBar
                value={Math.min(
                  100,
                  moduleBestScores.length > 0
                    ? (finalScore / policy.programPassThreshold) * 100
                    : 0,
                )}
                className="flex-1"
                size="md"
                color={passed ? "success" : "primary"}
              />
              <span className="text-sm font-medium tabular-nums shrink-0">
                {policy.programPassThreshold}%
              </span>
            </div>
          </Card>

          {/* Final grade + breakdown */}
          <Card className="p-5">
            <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Award size={18} />
              {t("evaluation.yourResult")}
            </h2>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div
                className={cn(
                  "text-4xl font-bold tabular-nums",
                  passed && moduleBestScores.length > 0
                    ? "text-green-600"
                    : "text-text-primary",
                )}
              >
                {moduleBestScores.length > 0 ? `${finalScore}%` : "—"}
              </div>
              {programCompleted || certificate ? (
                <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  {t("evaluation.programPassed")}
                </span>
              ) : moduleBestScores.length > 0 ? (
                <span className="text-sm text-text-secondary">
                  {t("evaluation.passThreshold", {
                    score: policy.programPassThreshold,
                  })}
                </span>
              ) : (
                <span className="text-sm text-text-secondary">
                  {t("evaluation.noScoresYet")}
                </span>
              )}
            </div>

            {moduleBestScores.length > 0 && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-2 text-sm">
                <p className="font-medium text-text-primary">
                  {t("evaluation.scoreBreakdown")}
                </p>
                <div className="flex justify-between gap-2 text-text-secondary">
                  <span>
                    {t("evaluation.moduleAvgContribution", {
                      avg: moduleAvg,
                      weight: generalExamEnabled
                        ? policy.moduleExamWeight
                        : 100,
                    })}
                  </span>
                  <span className="font-medium text-text-primary tabular-nums">
                    {generalExamEnabled
                      ? `${moduleContribution}%`
                      : `${moduleAvg}%`}
                  </span>
                </div>
                {generalExamEnabled && (
                  <div className="flex justify-between gap-2 text-text-secondary">
                    <span>
                      {t("evaluation.finalContribution", {
                        score: bestGeneralScore ?? "—",
                        weight: policy.generalExamWeight,
                      })}
                    </span>
                    <span className="font-medium text-text-primary tabular-nums">
                      {finalContribution != null
                        ? `${finalContribution}%`
                        : "—"}
                    </span>
                  </div>
                )}
                {generalExamEnabled && bestGeneralScore == null && (
                  <p className="text-xs text-amber-700 pt-1">
                    {generalUnlocked
                      ? t("evaluation.finalPendingForGrade")
                      : t("evaluation.finalLockedForGrade")}
                  </p>
                )}
              </div>
            )}

            {canConfirmResult && (
              <Button
                className="mt-4"
                onClick={onFinalize}
                loading={finalizing}
              >
                {t("evaluation.confirmResult")}
              </Button>
            )}

            {(programCompleted || certificate) && (
              <Link to={`/learn/program/${programId}/certificate`}>
                <Button variant="secondary" className="mt-3">
                  {t("learner.viewCertificate")}
                </Button>
              </Link>
            )}
          </Card>

          {/* Rules */}
          <Card className="overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setRulesOpen((o) => !o)}
              aria-expanded={rulesOpen}
            >
              <span className="flex items-center gap-2 font-semibold text-text-primary">
                <Info size={18} className="text-primary" />
                {t("evaluation.howItWorks")}
              </span>
              <ChevronRight
                size={18}
                className={cn(
                  "text-text-secondary transition-transform",
                  rulesOpen && "rotate-90",
                )}
              />
            </button>
            {rulesOpen && (
              <div className="px-5 pb-5 border-t border-gray-100">
                <ul className="text-sm text-text-secondary space-y-2 list-disc pl-5 mt-3">
                  <li>{t("evaluation.ruleModuleTests")}</li>
                  {generalExamEnabled ? (
                    <>
                      <li>
                        {t("evaluation.ruleWeights", {
                          module: policy.moduleExamWeight,
                          general: policy.generalExamWeight,
                        })}
                      </li>
                      <li>{t("evaluation.ruleHighest")}</li>
                      <li>
                        {requireModulePass
                          ? t("evaluation.ruleUnlockPass")
                          : t("evaluation.ruleUnlockAttempt")}
                      </li>
                    </>
                  ) : (
                    <li>{t("evaluation.ruleAverageOnly")}</li>
                  )}
                  <li>
                    {t("evaluation.rulePassThreshold", {
                      score: policy.programPassThreshold,
                    })}
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-text-secondary">
                  <p className="font-medium text-text-primary mb-1">
                    {t("evaluation.exampleTitle")}
                  </p>
                  <p>{t("evaluation.exampleBody")}</p>
                </div>
              </div>
            )}
          </Card>

          {/* Module tests */}
          <Card className="p-5">
            <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <BookOpen size={18} />
              {t("evaluation.moduleTests")}
            </h2>
            <div className="space-y-3">
              {modules.map((mod) => {
                const summary =
                  mod.examSummary ??
                  moduleSummaries.find((s) => s.moduleId === mod._id);
                const done = summary?.hasSubmittedAttempt;
                const modPassed = summary?.passed;
                return (
                  <div
                    key={mod._id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {done ? (
                        modPassed ? (
                          <CheckCircle
                            size={18}
                            className="text-green-500 shrink-0"
                          />
                        ) : (
                          <XCircle
                            size={18}
                            className="text-amber-500 shrink-0"
                          />
                        )
                      ) : (
                        <Circle size={18} className="text-gray-300 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {mod.title}
                        </p>
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-text-secondary mt-0.5">
                          <span>
                            {t("evaluation.moduleRequiredScore", {
                              score: mod.passingScore,
                            })}
                          </span>
                          {done ? (
                            <>
                              <span>·</span>
                              <span>
                                {t("evaluation.bestScore", {
                                  score: summary.bestScore,
                                })}
                              </span>
                              <span>·</span>
                              <span>
                                {t("evaluation.moduleAttempts", {
                                  count: summary.attemptCount ?? 0,
                                })}
                              </span>
                              <span
                                className={cn(
                                  "font-medium",
                                  modPassed
                                    ? "text-green-600"
                                    : "text-amber-600",
                                )}
                              >
                                {modPassed
                                  ? t("evaluation.modulePassed")
                                  : t("evaluation.moduleNotPassed")}
                              </span>
                            </>
                          ) : (
                            <span>{t("evaluation.moduleNotAttempted")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => navigate(`/learn/module/${mod._id}`)}
                    >
                      {done
                        ? t("evaluation.retakeModule")
                        : t("evaluation.goToModule")}
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Final evaluation */}
          {generalExamEnabled && (
            <Card className="p-5">
              <h2 className="font-semibold text-text-primary mb-3">
                {t("evaluation.finalExamTitle")}
              </h2>
              <div
                className={cn(
                  "rounded-xl border p-4",
                  canTakeFinalExam
                    ? "border-primary-200 bg-primary-50/60"
                    : "border-gray-200 bg-gray-50",
                )}
              >
                {!generalUnlocked ? (
                  <div className="flex items-start gap-3 text-sm">
                    <Lock
                      size={18}
                      className="text-text-secondary shrink-0 mt-0.5"
                    />
                    <p className="text-text-secondary">
                      {requireModulePass
                        ? t("evaluation.finalPendingPasses", {
                            count: pendingModuleCount,
                          })
                        : t("evaluation.finalPendingModules", {
                            count: pendingModuleCount,
                          })}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {canTakeFinalExam ? (
                      <p className="text-sm text-primary-800 font-medium">
                        {t("evaluation.finalEligible")}
                      </p>
                    ) : (
                      <p className="text-sm text-text-secondary">
                        {t("evaluation.noRetakesLeftFinal")}
                      </p>
                    )}
                    <p className="text-sm text-text-secondary">
                      {t("evaluation.finalExamGradeWeight", {
                        general: policy.generalExamWeight,
                        module: policy.moduleExamWeight,
                      })}
                    </p>
                    {maxFinalRetakes === "unlimited" ? (
                      <p className="text-xs text-text-secondary">
                        {t("evaluation.finalExamAttemptsUnlimited", {
                          used: submittedGeneralCount,
                        })}
                      </p>
                    ) : (
                      <p className="text-xs text-text-secondary">
                        {t("evaluation.finalExamAttemptsInfo", {
                          used: submittedGeneralCount,
                          max: maxFinalRetakes,
                          remaining: finalRetakesLeft,
                        })}
                      </p>
                    )}
                    {bestGeneralScore != null && (
                      <p className="text-sm font-medium text-text-primary">
                        {t("evaluation.bestGeneral", {
                          score: bestGeneralScore,
                        })}
                      </p>
                    )}
                    {canTakeFinalExam && (
                      <Button
                        onClick={() =>
                          navigate(`/learn/program/${programId}/final-exam`)
                        }
                      >
                        {bestGeneralScore != null
                          ? t("evaluation.retakeFinal")
                          : t("evaluation.startFinal")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
