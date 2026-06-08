import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "convex/react";
import { ChevronLeft, ChevronRight, Clock, AlertCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/Progress";
import { cn } from "../../lib/utils";
import { useConvexSession } from "../../hooks/useConvexSession";
import { useProgramEvaluation } from "../../hooks/useProgramEvaluation";

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function GeneralExamPage() {
  const { t } = useTranslation();
  const { programId } = useParams();
  const navigate = useNavigate();
  const { convexUser } = useConvexSession();
  const { evaluation, handleFinalize } = useProgramEvaluation(programId);

  const convexQuestions = useQuery(
    api.generalExams.listQuestions,
    programId ? { programId } : "skip"
  );

  const examSettings = useQuery(
    api.generalExams.getSettings,
    programId ? { programId } : "skip"
  );

  const attempts = useQuery(
    api.generalExams.getAttempts,
    convexUser?._id && programId ? { programId } : "skip"
  );

  const startAttempt = useMutation(api.generalExams.startAttempt);
  const submitAttempt = useMutation(api.generalExams.submitAttempt);

  const [started, setStarted] = useState(false);
  const [displayQuestions, setDisplayQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [attemptId, setAttemptId] = useState(null);
  const timerRef = useRef(null);

  const policy = evaluation?.policy;
  const maxRetakes = policy?.generalExamMaxRetakes ?? 3;
  const submittedAttempts = (attempts ?? []).filter((a) => a.submittedAt != null);
  const retakesLeft =
    maxRetakes === "unlimited"
      ? Infinity
      : Math.max(0, maxRetakes - submittedAttempts.length);
  const canStartExam = retakesLeft > 0;

  const defaultMinutes = examSettings?.timeLimitMinutes ?? 45;
  const hasTimeLimit = defaultMinutes > 0;

  useEffect(() => {
    if (examSettings === undefined) return;
    const minutes = examSettings?.timeLimitMinutes ?? 45;
    if (minutes > 0) setTimeLeft(minutes * 60);
  }, [examSettings]);

  useEffect(() => {
    if (!started || !hasTimeLimit) return;
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
  }, [started, hasTimeLimit]);

  const sortedQuestions = useMemo(
    () => [...(convexQuestions ?? [])].sort((a, b) => a.order - b.order),
    [convexQuestions]
  );

  if (!evaluation?.generalUnlocked) {
    return (
      <div className="p-6 text-center">
        <p className="text-text-secondary mb-4">{t("evaluation.finalLocked")}</p>
        <Button
          variant="outline"
          onClick={() => navigate(`/learn/program/${programId}`)}
        >
          {t("trainings.backToProgram")}
        </Button>
      </div>
    );
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const totalQ = displayQuestions.length;
  const currentQ = displayQuestions[currentIdx];

  const handleStart = async () => {
    if (!convexUser?._id || !programId || !canStartExam || sortedQuestions.length === 0) {
      return;
    }

    const ordered = examSettings?.randomizeQuestions
      ? shuffleArray(sortedQuestions)
      : sortedQuestions;
    setDisplayQuestions(ordered);

    const id = await startAttempt({
      programId,
      organizationId: convexUser.organizationId,
      attemptNumber: submittedAttempts.length + 1,
    });
    setAttemptId(id);
    setStarted(true);
  };

  const handleSubmit = async (autoSubmit = false) => {
    clearInterval(timerRef.current);

    const questions = displayQuestions.length > 0 ? displayQuestions : sortedQuestions;
    let correct = 0;
    for (const q of questions) {
      if (answers[q._id] === q.correctOptionId) correct++;
    }
    const score =
      questions.length > 0 ? Math.round((correct / questions.length) * 1000) / 10 : 0;

    if (convexUser?._id && programId && attemptId) {
      await submitAttempt({
        attemptId,
        answers: questions.map((q) => ({
          questionId: q._id,
          selectedOptionId: answers[q._id] ?? "",
        })),
      });
      await handleFinalize();
    }

    navigate(`/learn/program/${programId}/final-results`, {
      state: { score, autoSubmit },
    });
  };

  if (!started) {
    return (
      <div className="p-4 md:p-6 max-w-lg mx-auto">
        <button
          onClick={() => navigate(`/learn/program/${programId}`)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-6"
        >
          <ChevronLeft size={16} />
          {t("trainings.backToProgram")}
        </button>
        <div className="bg-white rounded-card shadow-card p-6">
          <AlertCircle size={40} className="text-primary mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text-primary text-center mb-2">
            {t("evaluation.finalExamTitle")}
          </h1>
          <p className="text-sm text-text-secondary text-center mb-6">
            {evaluation.program?.title}
          </p>
          <ul className="text-sm space-y-2 mb-4 text-text-secondary">
            <li>
              {t("learner.questionsCount")}: {sortedQuestions.length}
            </li>
            <li>
              {t("learner.timeLimit")}:{" "}
              {hasTimeLimit
                ? `${defaultMinutes} ${t("evaluation.minutes")}`
                : t("common.unlimited")}
            </li>
            <li>
              {maxRetakes === "unlimited"
                ? t("evaluation.finalExamAttemptsUnlimited", {
                    used: submittedAttempts.length,
                  })
                : t("evaluation.finalExamAttemptsInfo", {
                    used: submittedAttempts.length,
                    max: maxRetakes,
                    remaining: retakesLeft,
                  })}
            </li>
          </ul>
          {policy?.generalExamEnabled && (
            <p className="text-sm text-primary-800 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2.5 mb-6 leading-relaxed">
              {t("evaluation.finalExamGradeWeight", {
                general: policy.generalExamWeight,
                module: policy.moduleExamWeight,
              })}
            </p>
          )}
          {!canStartExam && (
            <p className="text-sm text-red-600 mb-4 text-center">
              {t("evaluation.noRetakesLeftFinal")}
            </p>
          )}
          <Button
            fullWidth
            disabled={sortedQuestions.length === 0 || !canStartExam}
            onClick={handleStart}
          >
            {t("learner.startExam")}
          </Button>
          {sortedQuestions.length === 0 && (
            <p className="text-xs text-amber-600 mt-2 text-center">
              {t("evaluation.noFinalQuestions")}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-text-secondary">
          {t("learner.questionOf", {
            current: currentIdx + 1,
            total: totalQ,
          })}
        </span>
        {hasTimeLimit && (
          <span className="flex items-center gap-1 text-sm font-medium text-secondary">
            <Clock size={14} />
            {formatTime(timeLeft)}
          </span>
        )}
      </div>
      <ProgressBar
        value={totalQ > 0 ? ((currentIdx + 1) / totalQ) * 100 : 0}
        size="sm"
        className="mb-6"
      />

      <div className="bg-white rounded-card shadow-card p-5">
        {currentQ && (
          <>
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

            <div className="flex gap-3 mt-6 pt-2">
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
                  {t("learner.submitExamBtn")}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
