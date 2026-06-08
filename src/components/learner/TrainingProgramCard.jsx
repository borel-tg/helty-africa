import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { GraduationCap, ChevronRight } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { ProgressBar } from "../ui/Progress";

export function TrainingProgramCard({ program, onJoin }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const enrolled = program.enrolled;
  const moduleCount = program.moduleCount ?? program.moduleIds?.length ?? 0;

  const progress = useQuery(
    api.trainingPrograms.getLearnerProgramProgress,
    enrolled && program._id ? { programId: program._id } : "skip"
  );

  const moduleSummaries = progress?.moduleSummaries ?? [];
  const totalModules = moduleSummaries.length || moduleCount;
  const completedModules = moduleSummaries.filter(
    (m) => m.passed || m.hasSubmittedAttempt
  ).length;
  const pct =
    totalModules > 0
      ? Math.round((completedModules / totalModules) * 100)
      : 0;

  const openProgram = () => {
    navigate(`/learn/program/${program._id}`);
  };

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
      onClick={openProgram}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
          <GraduationCap size={22} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary">{program.title}</h3>
          <p className="text-sm text-text-secondary line-clamp-2 mt-0.5">
            {program.description}
          </p>
          <p className="text-xs text-text-secondary mt-2">
            {t("trainings.moduleCount", { count: moduleCount })}
            {enrolled && totalModules > 0 && (
              <>
                {" · "}
                {t("trainings.modulesProgress", {
                  done: completedModules,
                  total: totalModules,
                })}
              </>
            )}
          </p>
          {enrolled && totalModules > 0 && (
            <ProgressBar value={pct} className="mt-2" size="sm" />
          )}
        </div>
        <ChevronRight size={18} className="text-gray-300 shrink-0 mt-1" />
      </div>
      {!enrolled && program.canJoin && (
        <Button
          size="sm"
          className="mt-3 w-full sm:w-auto"
          onClick={(e) => {
            e.stopPropagation();
            onJoin?.(program);
          }}
        >
          {t("evaluation.joinProgram")}
        </Button>
      )}
      {enrolled && (
        <Button
          size="sm"
          variant="outline"
          className="mt-3 w-full sm:w-auto"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/learn/program/${program._id}`);
          }}
        >
          {t("trainings.openProgram")}
        </Button>
      )}
    </Card>
  );
}
