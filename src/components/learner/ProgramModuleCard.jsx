import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { BookOpen, ChevronRight, Play, RotateCcw } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Card } from "../ui/Card";
import { StatusBadge } from "../ui/Badge";
import { ProgressBar } from "../ui/Progress";
import { Button } from "../ui/Button";

export function ProgramModuleCard({ module, examSummary }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const lessons = useQuery(api.lessons.listByModule, { moduleId: module._id });
  const progressRows = useQuery(
    api.progress.getModuleProgress,
    { moduleId: module._id }
  );

  const total = lessons?.length ?? 0;
  const completedIds = new Set(
    (progressRows ?? []).filter((p) => p.completed).map((p) => p.lessonId)
  );
  const completedCount = completedIds.size;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  let status = "not_started";
  if (examSummary?.passed && examSummary?.hasSubmittedAttempt) {
    status = "completed";
  } else if (total > 0 && completedCount === total) {
    status = "ready_for_exam";
  } else if (completedCount > 0) {
    status = "in_progress";
  }

  const ctaLabel = {
    not_started: t("learner.start"),
    in_progress: t("learner.resume"),
    ready_for_exam: t("learner.takeExam"),
    completed: t("learner.review"),
    failed: t("learner.contactAdmin"),
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-150"
      onClick={() => navigate(`/learn/module/${module._id}`)}
    >
      <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center relative">
        <BookOpen size={40} className="text-primary opacity-40" />
        <div className="absolute bottom-0 left-0 right-0">
          <ProgressBar
            value={pct}
            color={status === "completed" ? "success" : "primary"}
            size="xs"
          />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-semibold text-text-primary leading-snug flex-1">
            {module.title}
          </h3>
          <StatusBadge status={status} />
        </div>
        <p className="text-sm text-text-secondary line-clamp-2 mb-3">
          {module.description}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mb-3">
          <span>
            {t("learner.lessonsDone", { done: completedCount, total })}
          </span>
          {examSummary?.bestScore != null && (
            <span>
              {t("trainings.moduleBestScore", { score: examSummary.bestScore })}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant={status === "ready_for_exam" ? "secondary" : "primary"}
          fullWidth
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/learn/module/${module._id}`);
          }}
        >
          {status === "in_progress" ? <Play size={14} /> : null}
          {status === "ready_for_exam" ? <RotateCcw size={14} /> : null}
          {ctaLabel[status] ?? ctaLabel.in_progress}
          <ChevronRight size={14} className="ml-auto" />
        </Button>
      </div>
    </Card>
  );
}
