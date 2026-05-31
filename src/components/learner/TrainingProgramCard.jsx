import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GraduationCap, ChevronRight } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { ProgressBar } from "../ui/Progress";
import { getModuleLessonProgress } from "../../lib/moduleProgress";
import { MOCK_PROGRAM_EXAM_BEST } from "../../lib/mockData";

function getProgramProgress(program, userId) {
  const moduleIds = program.moduleIds ?? [];
  if (moduleIds.length === 0) {
    return { completedModules: 0, totalModules: 0, pct: 0 };
  }

  let completed = 0;
  for (const modId of moduleIds) {
    const { allComplete } = getModuleLessonProgress(modId);
    const best = MOCK_PROGRAM_EXAM_BEST[userId]?.[modId];
    if (allComplete || best != null) completed++;
  }

  return {
    completedModules: completed,
    totalModules: moduleIds.length,
    pct: Math.round((completed / moduleIds.length) * 100),
  };
}

export function TrainingProgramCard({ program, userId, onJoin }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const enrolled = program.enrolled;
  const moduleCount = program.moduleCount ?? program.moduleIds?.length ?? 0;
  const progress = enrolled ? getProgramProgress(program, userId) : null;

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
            {enrolled && progress && progress.totalModules > 0 && (
              <>
                {" · "}
                {t("trainings.modulesProgress", {
                  done: progress.completedModules,
                  total: progress.totalModules,
                })}
              </>
            )}
          </p>
          {enrolled && progress && progress.totalModules > 0 && (
            <ProgressBar value={progress.pct} className="mt-2" size="sm" />
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
