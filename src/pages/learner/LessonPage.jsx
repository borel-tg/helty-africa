import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Download,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { LessonContentBody } from "../../components/learner/LessonContent";
import { useLearnerModule } from "../../hooks/useLearnerModule";

// ── Main LessonPage ──────────────────────────────────────────────────────────
export default function LessonPage() {
  const { t } = useTranslation();
  const { moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const markCompleted = useMutation(api.progress.markCompleted);
  const {
    module,
    lessons,
    resources,
    examQuestions,
    isLessonCompleted,
    isLoading,
    notFound,
    convexUser,
  } = useLearnerModule(moduleId);

  const lesson = lessons.find((l) => l._id === lessonId);
  const lessonIndex = lessons.findIndex((l) => l._id === lessonId);
  const prevLesson = lessons[lessonIndex - 1];
  const nextLesson = lessons[lessonIndex + 1];
  const hasEvaluation = examQuestions.length > 0;

  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (lessonId) {
      setCompleted(isLessonCompleted(lessonId));
    }
  }, [lessonId, isLessonCompleted]);

  const handleComplete = async () => {
    setCompleted(true);
    if (convexUser?._id && module && lesson) {
      try {
        await markCompleted({
          lessonId: lesson._id,
          moduleId,
          organizationId: convexUser.organizationId,
        });
      } catch {
        /* progress sync failed */
      }
    }
    toast.success(t("learner.lessonComplete"));
  };

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

  if (!lesson) {
    return (
      <div className="p-6 text-center text-text-secondary">{t("learner.lessonNotFound")}</div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Back */}
      <button
        onClick={() => navigate(`/learn/module/${moduleId}`)}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        {t("learner.backToModule")}
      </button>

      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
          <span>{t("learner.lessonOf", { current: lessonIndex + 1, total: lessons.length })}</span>
          <span>·</span>
          <span className="capitalize">{lesson.type}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-text-primary">
            {lesson.title}
          </h1>
          {completed && (
            <CheckCircle size={24} className="text-green-500 shrink-0" />
          )}
        </div>
        {lesson.description && (
          <p className="text-text-secondary mt-1">{lesson.description}</p>
        )}
      </div>

      {/* Sidebar outline for desktop */}
      <div className="lg:flex gap-6 mt-6">
        {/* Module outline */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="bg-white rounded-card shadow-card p-4 sticky top-4 space-y-5">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
              {t("learner.moduleOutline")}
            </h3>
            {lessons.map((l, idx) => (
              <button
                key={l._id}
                onClick={() =>
                  navigate(`/learn/module/${moduleId}/lesson/${l._id}`)
                }
                className={`w-full flex items-center gap-2 py-2 px-2 rounded text-xs text-left transition-colors ${
                  l._id === lessonId
                    ? "bg-primary-50 text-primary font-medium"
                    : "text-text-secondary hover:bg-gray-50"
                }`}
              >
                {idx < lessonIndex ? (
                  <CheckCircle size={12} className="text-green-500 shrink-0" />
                ) : (
                  <span className="w-3 h-3 shrink-0 text-center text-[10px] leading-3 text-text-secondary">
                    {idx + 1}
                  </span>
                )}
                <span className="truncate">{l.title}</span>
              </button>
            ))}

            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                {t("common.resources")}
              </h3>
              {resources.length === 0 ? (
                <p className="text-xs text-text-secondary">{t("learner.noResourcesYet")}</p>
              ) : (
                <div className="space-y-2">
                  {resources.map((resource) => (
                    <a
                      key={resource._id}
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-2 text-xs text-primary hover:underline"
                    >
                      {resource.downloadable ? (
                        <Download size={12} className="mt-0.5 shrink-0" />
                      ) : (
                        <ExternalLink size={12} className="mt-0.5 shrink-0" />
                      )}
                      <span className="line-clamp-2">{resource.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Lesson content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-card shadow-card p-5 md:p-6">
            <LessonContentBody
              lesson={lesson}
              onComplete={handleComplete}
              completed={completed}
            />

            {completed && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500 shrink-0" />
                <p className="text-sm text-green-700 font-medium">
                  {t("learner.lessonCompleteBanner")}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={!prevLesson}
              onClick={() =>
                navigate(`/learn/module/${moduleId}/lesson/${prevLesson._id}`)
              }
            >
              <ArrowLeft size={14} />
              {t("common.previous")}
            </Button>
            {nextLesson ? (
              <Button
                size="sm"
                onClick={() =>
                  navigate(`/learn/module/${moduleId}/lesson/${nextLesson._id}`)
                }
              >
                {t("common.next")}
                <ArrowRight size={14} />
              </Button>
            ) : (
              hasEvaluation ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/learn/module/${moduleId}/exam`)}
                >
                  {t("learner.takeTest")}
                  <ArrowRight size={14} />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/learn/module/${moduleId}`)}
                >
                  {t("learner.backToModule")}
                  <ArrowRight size={14} />
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
