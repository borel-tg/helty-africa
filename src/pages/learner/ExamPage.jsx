import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "convex/react";
import { Clock, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/Progress";
import { cn } from "../../lib/utils";
import {
  answersToPayload,
  computeRemainingSeconds,
  savedAnswersToMap,
} from "../../lib/examTimer";
import { useLearnerModule } from "../../hooks/useLearnerModule";
import { useConvexSession } from "../../hooks/useConvexSession";

const DEFAULT_MINUTES = 30;

export default function ExamPage() {
  const { t } = useTranslation();
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { convexUser } = useConvexSession();
  const { module, examQuestions, isLoading, notFound } = useLearnerModule(moduleId);

  const examSettings = useQuery(
    api.exams.getSettings,
    moduleId ? { moduleId } : "skip"
  );
  const attempts = useQuery(
    api.exams.getAttempts,
    moduleId ? { moduleId } : "skip"
  );
  const activeAttempt = useQuery(
    api.exams.getActiveAttempt,
    moduleId ? { moduleId } : "skip"
  );

  const startAttempt = useMutation(api.exams.startAttempt);
  const saveProgress = useMutation(api.exams.saveProgress);
  const submitAttempt = useMutation(api.exams.submitAttempt);
  const finalizeExpiredAttempt = useMutation(api.exams.finalizeExpiredAttempt);

  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(DEFAULT_MINUTES);
  const [sessionReady, setSessionReady] = useState(false);

  const timerRef = useRef(null);
  const expiredHandledRef = useRef(false);
  const submitInFlightRef = useRef(false);
  const startedAtRef = useRef(null);

  const questions = examQuestions ?? [];
  const submittedAttempts = (attempts ?? []).filter((a) => a.submittedAt != null);
  const maxRetakes = module?.maxRetakes ?? 2;
  const retakesLeft =
    maxRetakes === "unlimited"
      ? Infinity
      : Math.max(0, maxRetakes - submittedAttempts.length);
  const canStartExam = retakesLeft > 0;
  const configuredMinutes = examSettings?.timeLimitMinutes ?? DEFAULT_MINUTES;
  const hasTimeLimit = configuredMinutes > 0;

  const goToResults = useCallback(
    (result, autoSubmit = false) => {
      navigate(`/learn/module/${moduleId}/results`, {
        state: {
          score: result.score,
          passed: result.passed,
          answers,
          questions,
          autoSubmit,
          programId: null,
        },
      });
    },
    [navigate, moduleId, answers, questions]
  );

  const handleSubmit = useCallback(
    async (autoSubmit = false) => {
      if (!attemptId || submitInFlightRef.current) return;
      submitInFlightRef.current = true;
      clearInterval(timerRef.current);

      try {
        const payload = answersToPayload(answers, questions);
        const result = await submitAttempt({ attemptId, answers: payload });
        goToResults(result, autoSubmit);
      } catch {
        submitInFlightRef.current = false;
      }
    },
    [attemptId, answers, questions, submitAttempt, goToResults]
  );

  useEffect(() => {
    if (activeAttempt === undefined || sessionReady || expiredHandledRef.current) {
      return;
    }

    if (!activeAttempt) {
      setSessionReady(true);
      return;
    }

    if (activeAttempt.expired) {
      expiredHandledRef.current = true;
      (async () => {
        try {
          const result = await finalizeExpiredAttempt({
            attemptId: activeAttempt.attemptId,
          });
          goToResults(
            { score: result.score, passed: result.passed ?? false },
            true
          );
        } catch {
          expiredHandledRef.current = false;
          setSessionReady(true);
        }
      })();
      return;
    }

    setAttemptId(activeAttempt.attemptId);
    setAnswers(savedAnswersToMap(activeAttempt.savedAnswers));
    setTimeLimitMinutes(activeAttempt.timeLimitMinutes || DEFAULT_MINUTES);
    startedAtRef.current = activeAttempt.startedAt;
    setTimeLeft(
      activeAttempt.remainingSeconds ??
        computeRemainingSeconds(
          activeAttempt.startedAt,
          activeAttempt.timeLimitMinutes
        )
    );
    setStarted(true);
    setSessionReady(true);
  }, [
    activeAttempt,
    sessionReady,
    finalizeExpiredAttempt,
    goToResults,
  ]);

  useEffect(() => {
    if (!started || !hasTimeLimit || startedAtRef.current == null) return;

    timerRef.current = setInterval(() => {
      const remaining = computeRemainingSeconds(
        startedAtRef.current,
        timeLimitMinutes
      );
      if (remaining == null) return;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        handleSubmit(true);
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [started, hasTimeLimit, timeLimitMinutes, handleSubmit]);

  useEffect(() => {
    if (!attemptId || !started) return;
    const payload = answersToPayload(answers, questions);
    const timeout = setTimeout(() => {
      saveProgress({ attemptId, savedAnswers: payload }).catch(() => {});
    }, 400);
    return () => clearTimeout(timeout);
  }, [attemptId, started, answers, questions, saveProgress]);

  const handleStart = async () => {
    if (!convexUser?._id || !moduleId || !canStartExam) return;

    const session = await startAttempt({
      moduleId,
      organizationId: convexUser.organizationId,
    });

    setAttemptId(session.attemptId);
    setAnswers(savedAnswersToMap(session.savedAnswers));
    setTimeLimitMinutes(session.timeLimitMinutes || configuredMinutes);
    startedAtRef.current = session.startedAt;
    setTimeLeft(
      computeRemainingSeconds(session.startedAt, session.timeLimitMinutes)
    );
    setStarted(true);
    setSessionReady(true);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (isLoading || activeAttempt === undefined || !sessionReady) {
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
          {hasTimeLimit && (
            <p className="text-sm text-text-secondary mb-4">
              {t("learner.timeLimit")}: {configuredMinutes} {t("evaluation.minutes")}
            </p>
          )}
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
        {hasTimeLimit && timeLeft != null && (
          <span className="flex items-center gap-1 text-sm font-medium text-secondary">
            <Clock size={14} />
            {formatTime(timeLeft)}
          </span>
        )}
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
