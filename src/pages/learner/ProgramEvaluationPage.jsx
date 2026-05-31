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
  Calculator,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/Progress";
import { useProgramEvaluation } from "../../hooks/useProgramEvaluation";
import { projectFinalScore } from "../../lib/evaluation";

export default function ProgramEvaluationPage() {
  const { t } = useTranslation();
  const { programId } = useParams();
  const navigate = useNavigate();
  const { evaluation, isLoading, sessionBlocked, handleEnroll, handleFinalize } =
    useProgramEvaluation(programId);

  const [previewScore, setPreviewScore] = useState("");
  const [finalizing, setFinalizing] = useState(false);

  if (isLoading) {
    return (
      <p className="p-6 text-center text-text-secondary">{t("common.loading")}</p>
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
  } = evaluation;

  const moduleBestScores = moduleSummaries
    .map((m) => m.bestScore)
    .filter((s) => s != null);

  const preview =
    previewScore !== "" && generalExamEnabled
      ? projectFinalScore(policy, moduleBestScores, Number(previewScore))
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

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate(`/learn/program/${programId}`)}
          className="text-sm text-text-secondary hover:text-primary mb-2"
        >
          ← {t("trainings.backToProgram")}
        </button>
        <h1 className="text-xl font-semibold text-text-primary">{program.title}</h1>
        <p className="text-sm text-text-secondary mt-1">{program.description}</p>
      </div>

      {!enrolled && program.accessMode === "open" && (
        <Card className="p-4 bg-primary-50 border border-primary-100">
          <p className="text-sm text-primary-800 mb-3">{t("evaluation.joinPrompt")}</p>
          <Button size="sm" onClick={onJoin}>
            {t("evaluation.joinProgram")}
          </Button>
        </Card>
      )}

      {/* Rules explainer */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info size={18} className="text-primary" />
          <h2 className="font-semibold text-text-primary">
            {t("evaluation.howItWorks")}
          </h2>
        </div>
        <ul className="text-sm text-text-secondary space-y-2 list-disc pl-5">
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
                {policy.unlockGeneralExamMode === "all_module_passes"
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
      </Card>

      {/* Module tests status */}
      <Card className="p-5">
        <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <BookOpen size={18} />
          {t("evaluation.moduleTests")}
        </h2>
        <div className="space-y-3">
          {modules.map((mod) => {
            const summary = mod.examSummary;
            const done = summary?.hasSubmittedAttempt;
            return (
              <div
                key={mod._id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-100"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {done ? (
                    <CheckCircle size={18} className="text-green-500 shrink-0" />
                  ) : (
                    <Circle size={18} className="text-gray-300 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {mod.title}
                    </p>
                    {done && (
                      <p className="text-xs text-text-secondary">
                        {t("evaluation.bestScore", {
                          score: summary.bestScore,
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/learn/module/${mod._id}`)}
                >
                  {done ? t("evaluation.retakeModule") : t("evaluation.goToModule")}
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
          <h2 className="font-semibold text-text-primary mb-2">
            {t("evaluation.finalExamTitle")}
          </h2>
          {!generalUnlocked ? (
            <div className="flex items-start gap-3 text-sm text-text-secondary">
              <Lock size={18} className="shrink-0 mt-0.5" />
              <p>{t("evaluation.finalLocked")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bestGeneralScore != null && (
                <p className="text-sm text-text-secondary">
                  {t("evaluation.bestGeneral", { score: bestGeneralScore })}
                </p>
              )}
              <Button
                onClick={() =>
                  navigate(`/learn/program/${programId}/final-exam`)
                }
              >
                {bestGeneralScore != null
                  ? t("evaluation.retakeFinal")
                  : t("evaluation.startFinal")}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Score summary */}
      <Card className="p-5">
        <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Award size={18} />
          {t("evaluation.yourResult")}
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <div
            className={`text-3xl font-bold ${passed ? "text-green-600" : "text-text-primary"}`}
          >
            {moduleBestScores.length > 0 ? finalScore : "—"}%
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
          ) : null}
        </div>

        {generalExamEnabled && moduleBestScores.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
              <Calculator size={16} />
              {t("evaluation.livePreview")}
            </div>
            <input
              type="number"
              min={0}
              max={100}
              placeholder={t("evaluation.previewPlaceholder")}
              value={previewScore}
              onChange={(e) => setPreviewScore(e.target.value)}
              className="input w-full max-w-xs text-sm mb-2"
            />
            {preview != null && !Number.isNaN(preview) && (
              <p className="text-sm text-primary font-medium">
                {t("evaluation.previewResult", { score: preview })}
              </p>
            )}
          </div>
        )}

        {!programCompleted &&
          enrolled &&
          ((!generalExamEnabled &&
            moduleSummaries.every((m) => m.hasSubmittedAttempt)) ||
            (generalExamEnabled && generalUnlocked && bestGeneralScore != null)) && (
            <Button onClick={onFinalize} loading={finalizing}>
              {t("evaluation.confirmResult")}
            </Button>
          )}

        {(programCompleted || certificate) && (
          <Link to={`/learn/program/${programId}/certificate`}>
            <Button variant="secondary" className="mt-2">
              {t("learner.viewCertificate")}
            </Button>
          </Link>
        )}
      </Card>
    </div>
  );
}
