import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/Progress";
import { cn } from "../../lib/utils";
import { MOCK_MODULES, MOCK_EXAM_QUESTIONS } from "../../lib/mockData";

export default function ExamPage() {
  const { t } = useTranslation();
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const module = MOCK_MODULES.find((m) => m._id === moduleId);
  const questions = MOCK_EXAM_QUESTIONS[moduleId] || [];

  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> optionId
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const timerRef = useRef(null);

  // Timer
  useEffect(() => {
    if (!started) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true); // auto-submit
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const currentQ = questions[currentIdx];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const pct = totalQ > 0 ? (currentIdx / totalQ) * 100 : 0;

  const selectAnswer = (optionId) => {
    setAnswers((prev) => ({ ...prev, [currentQ._id]: optionId }));
  };

  const handleSubmit = (autoSubmit = false) => {
    clearInterval(timerRef.current);
    // Calculate score
    let correct = 0;
    for (const q of questions) {
      if (answers[q._id] === q.correctOptionId) correct++;
    }
    const score = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;
    const passed = score >= (module?.passingScore || 70);
    navigate(`/learn/module/${moduleId}/results`, {
      state: { score, passed, answers, questions, autoSubmit },
    });
  };

  if (!module) {
    return <div className="p-6 text-center text-text-secondary">{t("learner.moduleNotFound")}</div>;
  }

  // ── Pre-exam info screen ────────────────────────────────────────────────
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

        <div className="bg-white rounded-card shadow-card p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-secondary-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-secondary" />
            </div>
            <h1 className="text-xl font-semibold text-text-primary mb-1">
              {t("learner.finalExam")}
            </h1>
            <p className="text-text-secondary">{module.title}</p>
          </div>

          <div className="space-y-3 mb-6">
            {[
              [t("learner.questionsCount"), t("learner.multipleChoice", { count: totalQ })],
              [t("learner.timeLimit"), t("learner.timeLimitValue")],
              [t("learner.passingScoreLabel"), `${module.passingScore}%`],
              [t("learner.retakesRemaining"), `${module.maxRetakes}`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between py-2 border-b border-gray-50"
              >
                <span className="text-sm text-text-secondary">{label}</span>
                <span className="text-sm font-medium text-text-primary">
                  {value}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 rounded-lg p-3 mb-6 border border-amber-100">
            <p className="text-sm text-amber-700">
              <strong>{t("learner.note")} :</strong> {t("learner.examNote")}
            </p>
          </div>

          <Button size="lg" fullWidth onClick={() => setStarted(true)}>
            {t("learner.startExam")}
          </Button>
        </div>
      </div>
    );
  }

  // ── Active exam ─────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Timer + Progress header */}
      <div className="bg-white rounded-card shadow-card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-text-secondary">
            {t("learner.questionOf", { current: currentIdx + 1, total: totalQ })}
          </span>
          <div
            className={cn(
              "flex items-center gap-1.5 text-sm font-mono font-semibold px-3 py-1 rounded-full",
              timeLeft < 300 ? "bg-red-50 text-red-600" : "bg-gray-100 text-text-secondary"
            )}
          >
            <Clock size={14} />
            {formatTime(timeLeft)}
          </div>
        </div>
        <ProgressBar value={currentIdx + 1} max={totalQ} />
      </div>

      {/* Question card */}
      {currentQ && (
        <div className="bg-white rounded-card shadow-card p-6 mb-4">
          <h2 className="text-base md:text-lg font-medium text-text-primary mb-6 leading-relaxed">
            {currentQ.questionText}
          </h2>

          <div className="space-y-3">
            {currentQ.options.map((option) => {
              const selected = answers[currentQ._id] === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => selectAnswer(option.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all duration-150",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    "min-h-[56px]",
                    selected
                      ? "border-primary bg-primary-50 text-primary"
                      : "border-gray-100 bg-white hover:border-primary-200 hover:bg-primary-50/30"
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center",
                      selected
                        ? "border-primary bg-primary"
                        : "border-gray-200"
                    )}
                  >
                    {selected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{option.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="md"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((i) => i - 1)}
        >
          <ChevronLeft size={16} />
          {t("common.previous")}
        </Button>

        <span className="text-xs text-text-secondary">
          {t("learner.answeredCount", { done: answeredCount, total: totalQ })}
        </span>

        {currentIdx < totalQ - 1 ? (
          <Button
            size="md"
            onClick={() => setCurrentIdx((i) => i + 1)}
          >
            {t("common.next")}
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Button
            size="md"
            variant="secondary"
            onClick={() => handleSubmit(false)}
            disabled={answeredCount < totalQ}
          >
            {t("learner.submitExamBtn")}
          </Button>
        )}
      </div>

      {/* Question dots */}
      <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
        {questions.map((q, idx) => (
          <button
            key={q._id}
            onClick={() => setCurrentIdx(idx)}
            className={cn(
              "w-7 h-7 rounded text-xs font-medium transition-colors",
              idx === currentIdx
                ? "bg-primary text-white"
                : answers[q._id]
                ? "bg-primary-100 text-primary"
                : "bg-gray-100 text-gray-500"
            )}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
