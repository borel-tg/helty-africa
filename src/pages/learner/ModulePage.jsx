import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CheckCircle, Circle, BookOpen, Video, FileText, ChevronRight, Lock, Download, ExternalLink } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { ProgressBar } from "../../components/ui/Progress";
import { useLearnerModule } from "../../hooks/useLearnerModule";

const TYPE_ICONS = {
  text: BookOpen,
  video: Video,
  document: FileText,
};

export default function ModulePage() {
  const { t } = useTranslation();
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const {
    module,
    lessons,
    resources,
    program,
    progress,
    isLessonCompleted,
    isLoading,
    notFound,
  } = useLearnerModule(moduleId);

  const { completedCount, total, pct, allComplete, status } = progress;

  if (isLoading) {
    return (
      <div className="p-6 text-center text-text-secondary">{t("common.loading")}</div>
    );
  }

  if (notFound || !module) {
    return (
      <div className="p-6 text-center text-text-secondary">{t("learner.moduleNotFound")}</div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full">
      <button
        onClick={() =>
          navigate(program ? `/learn/program/${program._id}` : "/learn")
        }
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        {program ? t("trainings.backToProgram") : t("trainings.backToTrainings")}
      </button>

      <div className="bg-white rounded-card shadow-card p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-xl font-semibold text-text-primary">{module.title}</h1>
          <StatusBadge status={status} />
        </div>
        <p className="text-text-secondary text-sm mb-4">{module.description}</p>

        <div className="flex items-center gap-6 text-sm text-text-secondary mb-3">
          <span>{t("learner.lessonsCount", { count: lessons.length })}</span>
          <span>{t("learner.passScore", { score: module.passingScore })}</span>
          <span>
            {module.maxRetakes === "unlimited"
              ? t("learner.retakesUnlimited")
              : t("learner.retakes", { count: module.maxRetakes })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ProgressBar value={pct} className="flex-1" size="md" />
          <span className="text-sm font-medium text-primary whitespace-nowrap">{pct}%</span>
        </div>
      </div>

      <div className="bg-white rounded-card shadow-card overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-text-primary">{t("common.lessons")}</h2>
        </div>
        {lessons.length === 0 ? (
          <div className="p-6 text-center text-text-secondary">{t("learner.noLessons")}</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {lessons.map((lesson, idx) => {
              const completed = isLessonCompleted(lesson._id);
              const Icon = TYPE_ICONS[lesson.type] || BookOpen;
              const unlocked =
                idx === 0 || isLessonCompleted(lessons[idx - 1]._id);

              return (
                <button
                  key={lesson._id}
                  type="button"
                  onClick={() =>
                    unlocked &&
                    navigate(`/learn/module/${moduleId}/lesson/${lesson._id}`)
                  }
                  disabled={!unlocked}
                  className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${
                    unlocked
                      ? "hover:bg-gray-50 cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="shrink-0">
                    {completed ? (
                      <CheckCircle size={22} className="text-green-500" />
                    ) : unlocked ? (
                      <Circle size={22} className="text-gray-300" />
                    ) : (
                      <Lock size={22} className="text-gray-300" />
                    )}
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${completed ? "text-text-secondary" : "text-text-primary"}`}
                    >
                      {idx + 1}. {lesson.title}
                    </p>
                    {lesson.description && (
                      <p className="text-xs text-text-secondary truncate mt-0.5">
                        {lesson.description}
                      </p>
                    )}
                  </div>

                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        className={`bg-white rounded-card shadow-card p-5 border-2 ${allComplete ? "border-secondary" : "border-gray-100"}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary mb-1">
              {t("learner.moduleEvaluation")}
            </h3>
            <p className="text-sm text-text-secondary">
              {allComplete
                ? t("learner.examReady")
                : t("learner.examLocked", { count: lessons.length })}
            </p>
          </div>
        </div>
        <Button
          className="mt-4"
          fullWidth
          variant={allComplete ? "secondary" : "outline"}
          disabled={!allComplete}
          onClick={() => navigate(`/learn/module/${moduleId}/exam`)}
        >
          {allComplete
            ? t("learner.takeFinalExam")
            : t("learner.lessonsComplete", { done: completedCount, total })}
          <ChevronRight size={16} className="ml-auto" />
        </Button>
      </div>

      <div className="bg-white rounded-card shadow-card overflow-hidden mt-4">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-text-primary">{t("common.resources")}</h2>
        </div>
        {resources.length === 0 ? (
          <div className="p-6 text-center text-text-secondary">
            {t("learner.noResourcesAdded")}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {resources.map((resource) => (
              <a
                key={resource._id}
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                  {resource.downloadable ? (
                    <Download size={16} className="text-primary" />
                  ) : (
                    <ExternalLink size={16} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{resource.title}</p>
                  {resource.description && (
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                      {resource.description}
                    </p>
                  )}
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
