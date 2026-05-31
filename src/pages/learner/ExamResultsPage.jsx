import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { CheckCircle, XCircle, Award, RotateCcw, BookOpen } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { CircularProgress } from "../../components/ui/Progress";
import { cn } from "../../lib/utils";
import { useLearnerModule } from "../../hooks/useLearnerModule";
import { useConvexSession } from "../../hooks/useConvexSession";

export default function ExamResultsPage() {
  const { t } = useTranslation();
  const { moduleId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { convexUser } = useConvexSession();
  const { module } = useLearnerModule(moduleId);

  const attempts = useQuery(
    api.exams.getAttempts,
    convexUser?._id && moduleId
      ? { userId: convexUser._id, moduleId }
      : "skip"
  );

  const enrolledCtx = useQuery(
    api.recentModules.findEnrolledProgramForModule,
    convexUser?._id && moduleId
      ? { userId: convexUser._id, moduleId }
      : "skip"
  );

  const programId = enrolledCtx?.program?._id;

  const score = state?.score ?? 0;
  const passed = state?.passed ?? false;
  const answers = state?.answers ?? {};
  const questions = state?.questions ?? [];

  const submittedAttempts = (attempts ?? []).filter((a) => a.submittedAt != null);
  const retakesUsed = submittedAttempts.length;
  const maxRetakes = module?.maxRetakes ?? 2;
  const retakesLeft =
    maxRetakes === "unlimited"
      ? "unlimited"
      : Math.max(0, (typeof maxRetakes === "number" ? maxRetakes : 3) - retakesUsed);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div
        className={cn(
          "rounded-card p-6 mb-6 text-center",
          passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
        )}
      >
        {passed ? (
          <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
        ) : (
          <XCircle size={48} className="text-red-400 mx-auto mb-3" />
        )}

        <h1 className="text-2xl font-bold text-text-primary mb-1">
          {passed ? t("learner.congratulations") : t("learner.notPassed")}
        </h1>
        <p className="text-text-secondary">
          {passed
            ? t("learner.passedMessage")
            : t("learner.needScoreToPass", { score: module?.passingScore || 70 })}
        </p>

        <div className="flex items-center justify-center gap-6 mt-5">
          <div className="relative">
            <CircularProgress value={score} size={80} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={cn(
                  "text-xl font-bold",
                  passed ? "text-primary" : "text-red-500"
                )}
              >
                {score}%
              </span>
            </div>
          </div>
          <div className="text-left">
            <p className="text-sm text-text-secondary">{t("learner.yourScoreLabel")}</p>
            <p
              className={cn(
                "text-2xl font-bold",
                passed ? "text-primary" : "text-red-500"
              )}
            >
              {score}%
            </p>
            <p className="text-sm text-text-secondary">
              {t("learner.passMark", { score: module?.passingScore || 70 })}
            </p>
          </div>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="bg-white rounded-card shadow-card mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold">{t("learner.answerReview")}</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {questions.map((q, idx) => {
              const selected = answers[q._id];
              const correct = q.correctOptionId;
              const isCorrect = selected === correct;
              return (
                <div key={q._id} className="px-5 py-4">
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm font-medium text-text-primary">
                      {idx + 1}. {q.questionText}
                    </p>
                  </div>
                  <div className="ml-6 space-y-1">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded",
                          opt.id === correct
                            ? "bg-green-50 text-green-700 font-medium"
                            : opt.id === selected && !isCorrect
                              ? "bg-red-50 text-red-600 line-through"
                              : "text-text-secondary"
                        )}
                      >
                        {opt.id === correct ? "✓ " : opt.id === selected ? "✗ " : "  "}
                        {opt.text}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {passed && programId ? (
          <>
            <Button
              fullWidth
              size="lg"
              onClick={() => navigate(`/learn/program/${programId}/evaluation`)}
            >
              <Award size={18} />
              {t("learner.viewProgramEvaluation")}
            </Button>
            <Button fullWidth variant="outline" onClick={() => navigate("/learn")}>
              {t("learner.backToDashboard")}
            </Button>
          </>
        ) : passed ? (
          <Button fullWidth variant="outline" onClick={() => navigate("/learn")}>
            {t("learner.backToDashboard")}
          </Button>
        ) : (
          <>
            {retakesLeft !== 0 ? (
              <Button
                fullWidth
                size="lg"
                variant="secondary"
                onClick={() => navigate(`/learn/module/${moduleId}/exam`)}
              >
                <RotateCcw size={18} />
                {t("learner.retakeExam")}
                {retakesLeft !== "unlimited" && (
                  <span className="ml-1 text-xs opacity-75">
                    {t("learner.retakesLeft", { count: retakesLeft })}
                  </span>
                )}
              </Button>
            ) : (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-center">
                <p className="text-sm font-medium text-red-700">
                  {t("learner.noRetakesLeft")}
                </p>
                <p className="text-xs text-red-500 mt-1">
                  {t("learner.contactAdminRetakes")}
                </p>
              </div>
            )}
            <Button
              fullWidth
              variant="outline"
              onClick={() => navigate(`/learn/module/${moduleId}`)}
            >
              <BookOpen size={16} />
              {t("learner.reviewLessons")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
