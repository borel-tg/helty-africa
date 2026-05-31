import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Info,
  ClipboardList,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/Progress";
import { LeaderboardCard } from "../../components/leaderboard/LeaderboardCard";
import { ProgramModuleCard } from "../../components/learner/ProgramModuleCard";
import { useProgramEvaluation } from "../../hooks/useProgramEvaluation";
import { useConvexSession } from "../../hooks/useConvexSession";
import { cn } from "../../lib/utils";

export default function ProgramHubPage() {
  const { t } = useTranslation();
  const { programId } = useParams();
  const navigate = useNavigate();
  const { convexUser } = useConvexSession();
  const { evaluation, isLoading, sessionBlocked, handleEnroll } =
    useProgramEvaluation(programId);

  const convexDetail = useQuery(
    api.trainingPrograms.getById,
    programId ? { programId } : "skip"
  );

  const allProgress = useQuery(
    api.progress.getAllProgressForUser,
    convexUser?._id && convexUser?.organizationId
      ? { userId: convexUser._id, organizationId: convexUser.organizationId }
      : "skip"
  );

  const [policyOpen, setPolicyOpen] = useState(false);

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

  const { program, policy, modules, moduleSummaries, enrolled } = evaluation;
  const displayModules =
    modules.length > 0
      ? modules
      : convexDetail?.modules ?? [];

  let modulesComplete = 0;
  let modulesWithLessonsDone = 0;
  for (const mod of displayModules) {
    const modProgress = (allProgress ?? []).filter((p) => p.moduleId === mod._id);
    const completedLessons = modProgress.filter((p) => p.completed).length;
    const lessonCount = mod.lessonCount ?? 0;
    if (lessonCount > 0 && completedLessons >= lessonCount) {
      modulesWithLessonsDone++;
    }
    const summary = moduleSummaries?.find((s) => s.moduleId === mod._id);
    if (summary?.hasSubmittedAttempt) modulesComplete++;
  }

  const totalModules = displayModules.length;
  const overviewPct =
    totalModules > 0
      ? Math.round((modulesWithLessonsDone / totalModules) * 100)
      : 0;

  const onJoin = async () => {
    try {
      await handleEnroll();
    } catch {
      return;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => navigate("/learn")}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary"
      >
        <ArrowLeft size={16} />
        {t("trainings.backToTrainings")}
      </button>

      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-text-primary">
          {program.title}
        </h1>
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

      {enrolled && (
        <>
          <Card className="p-5">
            <h2 className="text-base font-semibold text-text-primary mb-4">
              {t("trainings.programOverview")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <OverviewStat
                label={t("trainings.statModules")}
                value={`${modulesWithLessonsDone}/${totalModules}`}
              />
              <OverviewStat
                label={t("trainings.statModuleTests")}
                value={`${modulesComplete}/${totalModules}`}
              />
              {policy.generalExamEnabled && (
                <OverviewStat
                  label={t("trainings.statFinalExam")}
                  value={
                    evaluation.generalUnlocked
                      ? evaluation.bestGeneralScore != null
                        ? `${evaluation.bestGeneralScore}%`
                        : t("trainings.available")
                      : t("trainings.locked")
                  }
                />
              )}
              <OverviewStat
                label={t("trainings.statFinalScore")}
                value={
                  evaluation.finalScore != null && modulesComplete > 0
                    ? `${evaluation.finalScore}%`
                    : "—"
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary shrink-0">
                {t("trainings.lessonsProgress")}
              </span>
              <ProgressBar value={overviewPct} className="flex-1" size="md" />
              <span className="text-sm font-medium text-primary">{overviewPct}%</span>
            </div>
          </Card>

          <section>
            <LeaderboardCard mode="learner" programId={programId} />
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">
              {t("learner.modules")}
            </h2>
            {displayModules.length === 0 ? (
              <p className="text-sm text-text-secondary">{t("learner.noModulesYet")}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayModules.map((mod) => {
                  const examSummary = moduleSummaries?.find(
                    (s) => s.moduleId === mod._id
                  );
                  return (
                    <ProgramModuleCard
                      key={mod._id}
                      module={mod}
                      examSummary={examSummary}
                      userId={convexUser?._id}
                    />
                  );
                })}
              </div>
            )}
          </section>

          <Card className="overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setPolicyOpen((o) => !o)}
              aria-expanded={policyOpen}
            >
              <span className="flex items-center gap-2 font-semibold text-text-primary">
                <Info size={18} className="text-primary" />
                {t("trainings.evaluationPolicy")}
              </span>
              <ChevronDown
                size={18}
                className={cn(
                  "text-text-secondary transition-transform",
                  policyOpen && "rotate-180"
                )}
              />
            </button>
            {policyOpen && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <ul className="text-sm text-text-secondary space-y-2 list-disc pl-5 mt-3">
                  <li>{t("evaluation.ruleModuleTests")}</li>
                  {policy.generalExamEnabled ? (
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
                <Link
                  to={`/learn/program/${programId}/evaluation`}
                  className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-4 hover:underline"
                >
                  <ClipboardList size={16} />
                  {t("trainings.viewFullEvaluation")}
                  <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function OverviewStat({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-lg font-bold text-text-primary tabular-nums">{value}</p>
      <p className="text-[10px] sm:text-xs text-text-secondary mt-0.5 leading-tight">
        {label}
      </p>
    </div>
  );
}
