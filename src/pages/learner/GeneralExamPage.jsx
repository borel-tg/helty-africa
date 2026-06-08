import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "convex/react";
import { ChevronLeft, ChevronRight, Clock, AlertCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/Progress";
import { cn } from "../../lib/utils";
import {
  answersToPayload,
  computeRemainingSeconds,
  savedAnswersToMap,
} from "../../lib/examTimer";
import { useConvexSession } from "../../hooks/useConvexSession";
import { useProgramEvaluation } from "../../hooks/useProgramEvaluation";

const DEFAULT_MINUTES = 45;

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function orderQuestions(allQuestions, questionOrder) {
  if (!questionOrder?.length) return allQuestions;
  const byId = new Map(allQuestions.map((q) => [q._id, q]));
  const ordered = questionOrder
    .map((id) => byId.get(id))
    .filter(Boolean);
  if (ordered.length === allQuestions.length) return ordered;
  return allQuestions;
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
    programId ? { programId } : "skip"
  );
  const activeAttempt = useQuery(
    api.generalExams.getActiveAttempt,
    programId ? { programId } : "skip"
  );

  const startAttempt = useMutation(api.generalExams.startAttempt);
  const saveProgress = useMutation(api.generalExams.saveProgress);
  const submitAttempt = useMutation(api.generalExams.submitAttempt);
  const finalizeExpiredAttempt = useMutation(api.generalExams.finalizeExpiredAttempt);

  const [started, setStarted] = useState(false);
  const [displayQuestions, setDisplayQuestions] = useState([]);
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

  const policy = evaluation?.policy;
  const maxRetakes = policy?.generalExamMaxRetakes ?? 3;
  const submittedAttempts = (attempts ?? []).filter((a) => a.submittedAt != null);
  const retakesLeft =
    maxRetakes === "unlimited"
      ? Infinity
      : Math.max(0, maxRetakes - submittedAttempts.length);
  const canStartExam = retakesLeft > 0;
  const configuredMinutes = examSettings?.timeLimitMinutes ?? DEFAULT_MINUTES;
  const hasTimeLimit = configuredMinutes > 0;

  const sortedQuestions = useMemo(
    () => [...(convexQuestions ?? [])].sort((a, b) => a.order - b.order),
    [convexQuestions]
  );

  const applySession = useCallback(
    (session, allQuestions) => {
      const ordered = orderQuestions(allQuestions, session.questionOrder);
      setDisplayQuestions(ordered);
      setAttemptId(session.attemptId);
      setAnswers(savedAnswersToMap(session.savedAnswers));
      setTimeLimitMinutes(session.timeLimitMinutes || configuredMinutes);
      startedAtRef.current = session.startedAt;
      setTimeLeft(
        computeRemainingSeconds(session.startedAt, session.timeLimitMinutes)
      );
      setStarted(true);
      setSessionReady(true);
    },
    [configuredMinutes]
  );

  const goToResults = useCallback(
    (score, autoSubmit = false) => {
      navigate(`/learn/program/${programId}/final-results`, {
        state: { score, autoSubmit },
      });
    },
    [navigate, programId]
  );

  const handleSubmit = useCallback(
    async (autoSubmit = false) => {
      if (!attemptId || submitInFlightRef.current) return;
      submitInFlightRef.current = true;
      clearInterval(timerRef.current);

      const questions =
        displayQuestions.length > 0 ? displayQuestions : sortedQuestions;

      try {
        const result = await submitAttempt({
          attemptId,
          answers: answersToPayload(answers, questions),
        });
        await handleFinalize();
        goToResults(result.score, autoSubmit);
      } catch {
        submitInFlightRef.current = false;
      }
    },
    [
      attemptId,
      displayQuestions,
      sortedQuestions,
      answers,
      submitAttempt,
      handleFinalize,
      goToResults,
    ]
  );

  useEffect(() => {
    if (activeAttempt === undefined || sessionReady || expiredHandledRef.current) {
      return;
    }

    if (!activeAttempt) {
      setSessionReady(true);
      return;
    }

    if (sortedQuestions.length === 0) {
      return;
    }

    if (activeAttempt.expired) {
      expiredHandledRef.current = true;
      (async () => {
        try {
          const result = await finalizeExpiredAttempt({
            attemptId: activeAttempt.attemptId,
          });
          await handleFinalize();
          goToResults(result.score, true);
        } catch {
          expiredHandledRef.current = false;
          setSessionReady(true);
        }
      })();
      return;
    }

    applySession(activeAttempt, sortedQuestions);
  }, [
    activeAttempt,
    sortedQuestions,
    sessionReady,
    applySession,
    finalizeExpiredAttempt,
    handleFinalize,
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
    const questions =
      displayQuestions.length > 0 ? displayQuestions : sortedQuestions;
    const payload = answersToPayload(answers, questions);
    const timeout = setTimeout(() => {
      saveProgress({ attemptId, savedAnswers: payload }).catch(() => {});
    }, 400);
    return () => clearTimeout(timeout);
  }, [attemptId, started, answers, displayQuestions, sortedQuestions, saveProgress]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    if (!convexUser?._id || !programId || !canStartExam || sortedQuestions.length === 0) {
      return;
    }

    const ordered = examSettings?.randomizeQuestions
      ? shuffleArray(sortedQuestions)
      : sortedQuestions;

    const session = await startAttempt({
      programId,
      organizationId: convexUser.organizationId,
      questionOrder: ordered.map((q) => q._id),
    });

    applySession({ ...session, questionOrder: ordered.map((q) => q._id) }, sortedQuestions);
    setDisplayQuestions(ordered);
  };

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

  if (
    convexQuestions === undefined ||
    activeAttempt === undefined ||
    examSettings === undefined ||
    !sessionReady
  ) {
    return (
      <div className="p-6 text-center text-text-secondary">{t("common.loading")}</div>
    );
  }

  const totalQ = displayQuestions.length;
  const currentQ = displayQuestions[currentIdx];

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
                ? `${configuredMinutes} ${t("evaluation.minutes")}`
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
        {hasTimeLimit && timeLeft != null && (
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
