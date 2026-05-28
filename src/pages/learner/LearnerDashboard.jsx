import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, Award, Clock, ChevronRight, Play, RotateCcw } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/Badge";
import { ProgressBar } from "../../components/ui/Progress";
import { Button } from "../../components/ui/Button";
import {
  MOCK_MODULES,
  MOCK_LESSONS,
  MOCK_LEARNER_PROGRESS,
} from "../../lib/mockData";
import { LeaderboardCard } from "../../components/leaderboard/LeaderboardCard";

// Compute progress for a module
function useModuleStatus(module) {
  const lessons = MOCK_LESSONS[module._id] || [];
  const progress = MOCK_LEARNER_PROGRESS;
  const completedCount = lessons.filter(
    (l) => progress[l._id]?.completed
  ).length;
  const pct =
    lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  // Simulated: mod1 is in-progress, mod2 not started
  const statusMap = {
    mod1: "in_progress",
    mod2: "not_started",
    mod3: "not_started",
  };

  return { completedCount, total: lessons.length, pct, status: statusMap[module._id] || "not_started" };
}

function ModuleCard({ module }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { completedCount, total, pct, status } = useModuleStatus(module);

  const ctaLabel = {
    not_started: t("learner.start"),
    in_progress: t("learner.resume"),
    ready_for_exam: t("learner.takeExam"),
    completed: t("learner.review"),
    failed: t("learner.contactAdmin"),
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-150 hover:scale-[1.01]"
      onClick={() => navigate(`/learn/module/${module._id}`)}
    >
      {/* Thumbnail */}
      <div className="h-40 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center relative overflow-hidden">
        <BookOpen size={48} className="text-primary opacity-40" />
        {status === "completed" && (
          <div className="absolute top-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Award size={16} className="text-white" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1">
          <ProgressBar value={pct} color={status === "completed" ? "success" : "primary"} size="xs" />
        </div>
      </div>

      {/* Content */}
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

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-text-secondary mb-3">
          <span className="flex items-center gap-1">
            <BookOpen size={12} />
            {t("learner.lessonsCount", { count: total })}
          </span>
          {total > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {t("learner.lessonsDone", { done: completedCount, total })}
            </span>
          )}
          <span>{t("learner.passScore", { score: module.passingScore })}</span>
        </div>

        {/* Progress bar + CTA */}
        {total > 0 && (
          <ProgressBar value={pct} className="mb-3" size="sm" />
        )}

        <Button
          size="sm"
          variant={status === "ready_for_exam" ? "secondary" : "primary"}
          fullWidth
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/learn/module/${module._id}`);
          }}
          disabled={status === "failed"}
        >
          {status === "in_progress" ? <Play size={14} /> : status === "ready_for_exam" ? <RotateCcw size={14} /> : null}
          {ctaLabel[status]}
          <ChevronRight size={14} className="ml-auto" />
        </Button>
      </div>
    </Card>
  );
}

export default function LearnerDashboard() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const publishedModules = MOCK_MODULES.filter((m) => m.status === "published");

  const completedCount = 0;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-semibold text-text-primary">
          {t("learner.hello", { name: currentUser?.name?.split(" ")[0] })}
        </h2>
        <p className="text-text-secondary mt-1">
          {t("learner.dashboardSubtitle")}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: t("learner.modules"), value: publishedModules.length, icon: BookOpen, color: "text-primary" },
          { label: t("learner.completed"), value: completedCount, icon: Award, color: "text-green-600" },
          { label: t("learner.inProgress"), value: 1, icon: Clock, color: "text-secondary" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-card shadow-card px-3 py-3 text-center">
            <s.icon size={20} className={`mx-auto mb-1 ${s.color}`} />
            <p className="text-xl font-bold text-text-primary">{s.value}</p>
            <p className="text-xs text-text-secondary">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Module grid — primary action for learners */}
      {publishedModules.length === 0 ? (
        <div className="text-center py-16 mb-6">
          <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-text-secondary">{t("learner.noModulesYet")}</p>
          <p className="text-sm text-gray-400 mt-1">{t("learner.checkBackLater")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {publishedModules.map((module) => (
            <ModuleCard key={module._id} module={module} />
          ))}
        </div>
      )}

      {/* Leaderboard — compact (top 2) with expand for the rest */}
      <LeaderboardCard mode="learner" />
    </div>
  );
}
