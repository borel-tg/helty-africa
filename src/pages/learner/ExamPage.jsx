import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "convex/react";
import { Clock, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/Progress";
import { cn } from "../../lib/utils";
import { useLearnerModule } from "../../hooks/useLearnerModule";
import { useConvexSession } from "../../hooks/useConvexSession";

export default function ExamPage() {
  const { t } = useTranslation();
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { convexUser } = useConvexSession();
  const { module, examQuestions, isLoading, notFound } = useLearnerModule(moduleId);
  const attempts = useQuery(
    api.exams.getAttempts,
    convexUser?._id && moduleId ? { moduleId } : "skip"
  );
  const startAttempt = useMutation(api.exams.startAttempt);
  const submitAttempt = useMutation(api.exams.submitAttempt);

  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [attemptId, setAttemptId] = useState(null);
  const timerRef = useRef(null);

  const questions = examQuestions ?? [];
  const submittedAttempts = (attempts ?? []).filter((a) => a.submittedAt != null);
  const maxRetakes = module?.maxRetakes ?? 2;
  const retakesLeft =
    maxRetakes === "unlimited"
      ? Infinity
      : Math.max(0, maxRetakes - submittedAttempts.length);
  const canStartExam = retakesLeft > 0;

  useEffect(() => {
    if (!started) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    if (!convexUser?._id || !moduleId || !canStartExam) return;
    const id = await startAttempt({
      moduleId,
      organizationId: convexUser.organizationId,
    });
    setAttemptId(id);
    setStarted(true);
  };

  const handleSubmit = async (autoSubmit = false) => {
    clearInterval(timerRef.current);
    let score = 0;
    let passed = false;

    const answerList = questions.map((q) => ({
      questionId: q._id,
      selectedOptionId: answers[q._id] ?? "",
    }));

    if (attemptId) {
      const result = await submitAttempt({ attemptId, answers: answerList });
      score = result.score;
      passed = result.passed;
    } else {
      let correct = 0;
      for (const q of questions) {
        if (answers[q._id] === q.correctOptionId) correct++;
      }
      score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
      passed = score >= (module?.passingScore || 70);
    }

    navigate(`/learn/module/${moduleId}/results`, {
      state: { score, passed, answers, questions, autoSubmit, programId: null },
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-text-secondary">{t("common.loading")}</div>
    );
  }

  if (notFound || !module) {
    return (
      <div className="p-6 text-center text-text-secondary">
        {t("learner.moduleNotFound")}
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const totalQ = questions.length;
  const pct = totalQ > 0 ? (currentIdx / totalQ) * 100 : 0;

  if (!started) {
    return (
      <div className="p-4 md:p-6 max-w-lg mx-auto">
        <button
          onClick={() => navigate(`/learn/module/${moduleId}`)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-6 transition-colors"
        >
          <ChevronLeft size={16} />
          {t("learner.backToModule")}
        </button>
        <div className="bg-white rounded-card shadow-card p-6 text-center">
          <AlertCircle size={40} className="text-primary mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text-primary mb-2">
            {module.title} — {t("learner.moduleExam")}
          </h1>
          <p className="text-text-secondary mb-6">
            {t("learner.examInfo", {
              count: totalQ,
              score: module.passingScore,
            })}
          </p>
          {!canStartExam && (
            <p className="text-sm text-red-600 mb-4">{t("learner.noRetakesLeft")}</p>
          )}
          <Button size="lg" fullWidth onClick={handleStart} disabled={totalQ === 0 || !canStartExam}>
            {t("learner.startExam")}
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-text-secondary">
          {t("learner.questionOf", { current: currentIdx + 1, total: totalQ })}
        </span>
        <span className="flex items-center gap-1 text-sm font-medium text-secondary">
          <Clock size={14} />
          {formatTime(timeLeft)}
        </span>
      </div>
      <ProgressBar value={pct} size="sm" className="mb-6" />

      <div className="bg-white rounded-card shadow-card p-5 mb-6">
        <p className="text-base font-medium text-text-primary mb-4">
          {currentQ.questionText}
        </p>
        <div className="space-y-2">
          {currentQ.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() =>
                setAnswers((prev) => ({ ...prev, [currentQ._id]: opt.id }))
              }
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors",
                answers[currentQ._id] === opt.id
                  ? "border-primary bg-primary-50 text-primary font-medium"
                  : "border-gray-200 hover:border-primary-200"
              )}
            >
              {opt.text}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((i) => i - 1)}
        >
          <ChevronLeft size={16} />
          {t("common.previous")}
        </Button>
        {currentIdx < totalQ - 1 ? (
          <Button
            className="ml-auto"
            disabled={!answers[currentQ._id]}
            onClick={() => setCurrentIdx((i) => i + 1)}
          >
            {t("common.next")}
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Button className="ml-auto" onClick={() => handleSubmit(false)}>
            {t("learner.submitExam")}
          </Button>
        )}
      </div>
    </div>
  );
}
