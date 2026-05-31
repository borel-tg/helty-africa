import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "convex/react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/Progress";
import { cn } from "../../lib/utils";
import { useConvexSession } from "../../hooks/useConvexSession";
import { useProgramEvaluation } from "../../hooks/useProgramEvaluation";
import { MOCK_GENERAL_EXAM_QUESTIONS } from "../../lib/mockData";

export default function GeneralExamPage() {
  const { t } = useTranslation();
  const { programId } = useParams();
  const navigate = useNavigate();
  const { convexUser } = useConvexSession();
  const { evaluation, mockGeneralQuestions, isMock } =
    useProgramEvaluation(programId);

  const convexQuestions = useQuery(
    api.generalExams.listQuestions,
    programId && !isMock ? { programId } : "skip"
  );

  const startAttempt = useMutation(api.generalExams.startAttempt);
  const submitAttempt = useMutation(api.generalExams.submitAttempt);

  const questions = isMock
    ? mockGeneralQuestions
    : (convexQuestions ?? []);

  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const timerRef = useRef(null);

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

  if (!evaluation?.generalUnlocked) {
    return (
      <div className="p-6 text-center">
        <p className="text-text-secondary mb-4">{t("evaluation.finalLocked")}</p>
        <Button
          variant="outline"
          onClick={() => navigate(`/learn/program/${programId}/evaluation`)}
        >
          {t("evaluation.backToEvaluation")}
        </Button>
      </div>
    );
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const currentQ = questions[currentIdx];
  const totalQ = questions.length;

  const handleSubmit = async (autoSubmit = false) => {
    clearInterval(timerRef.current);
    let correct = 0;
    for (const q of questions) {
      if (answers[q._id] === q.correctOptionId) correct++;
    }
    const score =
      totalQ > 0 ? Math.round((correct / totalQ) * 1000) / 10 : 0;

    if (convexUser?._id && !isMock && programId) {
      const attemptId = await startAttempt({
        userId: convexUser._id,
        programId,
        organizationId: convexUser.organizationId,
        attemptNumber: 1,
      });
      await submitAttempt({
        attemptId,
        answers: questions.map((q) => ({
          questionId: q._id,
          selectedOptionId: answers[q._id] ?? "",
        })),
      });
    }

    navigate(`/learn/program/${programId}/final-results`, {
      state: { score, autoSubmit },
    });
  };

  if (!started) {
    return (
      <div className="p-4 md:p-6 max-w-lg mx-auto">
        <button
          onClick={() => navigate(`/learn/program/${programId}/evaluation`)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-6"
        >
          <ChevronLeft size={16} />
          {t("evaluation.backToEvaluation")}
        </button>
        <h1 className="text-xl font-semibold mb-2">
          {t("evaluation.finalExamTitle")}
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          {evaluation.program?.title}
        </p>
        <ul className="text-sm space-y-2 mb-6 text-text-secondary">
          <li>
            {t("learner.questionsCount")}: {totalQ}
          </li>
          <li>
            {t("learner.timeLimit")}: 45 {t("evaluation.minutes")}
          </li>
        </ul>
        <Button
          fullWidth
          disabled={totalQ === 0}
          onClick={() => setStarted(true)}
        >
          {t("learner.startExam")}
        </Button>
        {totalQ === 0 && (
          <p className="text-xs text-amber-600 mt-2 text-center">
            {t("evaluation.noFinalQuestions")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="text-sm font-medium">
          {t("learner.questionOf", {
            current: currentIdx + 1,
            total: totalQ,
          })}
        </span>
        <span className="flex items-center gap-1 text-sm text-text-secondary">
          <Clock size={14} />
          {formatTime(timeLeft)}
        </span>
      </div>
      <ProgressBar
        value={((currentIdx + 1) / totalQ) * 100}
        size="xs"
        className="rounded-none"
      />

      <div className="flex-1 p-4 max-w-lg mx-auto w-full">
        {currentQ && (
          <>
            <p className="font-medium text-text-primary mb-4">
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
                    "w-full text-left p-3 rounded-xl border text-sm transition-colors",
                    answers[currentQ._id] === opt.id
                      ? "border-primary bg-primary-50 text-primary"
                      : "border-gray-200 hover:border-primary-200"
                  )}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="bg-white border-t p-4 flex gap-2 max-w-lg mx-auto w-full">
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
            className="flex-1"
            disabled={!answers[currentQ?._id]}
            onClick={() => setCurrentIdx((i) => i + 1)}
          >
            {t("common.next")}
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Button className="flex-1" onClick={() => handleSubmit(false)}>
            {t("learner.submitExamBtn")}
          </Button>
        )}
      </div>
    </div>
  );
}
