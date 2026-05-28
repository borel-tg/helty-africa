import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Circle, Clock, Award } from "lucide-react";
import { MOCK_MODULES, MOCK_LESSONS } from "../../lib/mockData";
import { formatDate, formatTimeAgo, formatDuration } from "../../lib/utils";

// Reuse the same detail data as admin
const DETAIL_PROGRESS = {
  mod1: {
    lessonProgress: {
      les1: { completed: true, timeSpent: 720 },
      les2: { completed: true, timeSpent: 480 },
      les3: { completed: false, timeSpent: 120 },
    },
    examAttempts: [
      { attempt: 1, score: 55, passed: false, date: Date.now() - 5 * 86400000 },
      { attempt: 2, score: 85, passed: true, date: Date.now() - 3 * 86400000 },
    ],
  },
  mod2: {
    lessonProgress: {
      les4: { completed: true, timeSpent: 300 },
      les5: { completed: false, timeSpent: 60 },
    },
    examAttempts: [],
  },
};

const LEARNERS = {
  user_learner: { name: "Fatima Coulibaly", email: "fatima@helty.africa", phone: "+225 07 000 0004", lastLoginAt: Date.now() - 43200000, createdAt: Date.now() - 30 * 86400000 },
  user_learner2: { name: "Ibrahim Traoré", email: "ibrahim@helty.africa", phone: "+226 70 000 0005", lastLoginAt: Date.now() - 86400000, createdAt: Date.now() - 25 * 86400000 },
  user_learner3: { name: "Amina Diallo", email: "amina@helty.africa", phone: "+221 76 000 0006", lastLoginAt: Date.now() - 2 * 86400000, createdAt: Date.now() - 20 * 86400000 },
};

export default function LearnerDetailPage() {
  const { learnerId } = useParams();
  const navigate = useNavigate();
  const learner = LEARNERS[learnerId] || LEARNERS.user_learner;

  return (
    <div className="p-4 md:p-6 w-full">
      <button onClick={() => navigate("/lead")} className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to Team
      </button>

      {/* Profile */}
      <div className="bg-white rounded-card shadow-card p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-primary text-xl font-bold">{learner.name.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{learner.name}</h1>
            <p className="text-sm text-text-secondary">{learner.email} · {learner.phone}</p>
            <p className="text-xs text-text-secondary mt-0.5">
              Joined {formatDate(learner.createdAt)} · Last active {formatTimeAgo(learner.lastLoginAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Module progress */}
      <div className="space-y-4">
        {MOCK_MODULES.filter((m) => m.status === "published").map((mod) => {
          const detail = DETAIL_PROGRESS[mod._id];
          const lessons = MOCK_LESSONS[mod._id] || [];
          if (!detail) return null;

          const completedLessons = Object.values(detail.lessonProgress).filter((p) => p.completed).length;
          const totalTime = Object.values(detail.lessonProgress).reduce((a, p) => a + p.timeSpent, 0);
          const passed = detail.examAttempts.some((a) => a.passed);
          const pct = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;

          return (
            <div key={mod._id} className="bg-white rounded-card shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-text-primary">{mod.title}</h2>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {completedLessons}/{lessons.length} lessons · {formatDuration(totalTime)} spent
                    </p>
                  </div>
                  {passed && (
                    <div className="flex items-center gap-1 text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <Award size={14} /> Certified
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {lessons.map((lesson) => {
                    const p = detail.lessonProgress[lesson._id];
                    return (
                      <div key={lesson._id} className="flex items-center gap-2 p-2 rounded bg-gray-50">
                        {p?.completed ? (
                          <CheckCircle size={14} className="text-green-500 shrink-0" />
                        ) : (
                          <Circle size={14} className="text-gray-300 shrink-0" />
                        )}
                        <span className="text-xs text-text-primary truncate flex-1">{lesson.title}</span>
                        {p && (
                          <span className="text-[10px] text-text-secondary flex items-center gap-0.5 shrink-0">
                            <Clock size={9} /> {formatDuration(p.timeSpent)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {detail.examAttempts.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Exam Attempts</p>
                    <div className="space-y-1">
                      {detail.examAttempts.map((a) => (
                        <div key={a.attempt} className={`flex items-center gap-3 p-2.5 rounded text-sm ${a.passed ? "bg-green-50" : "bg-red-50"}`}>
                          {a.passed ? <CheckCircle size={14} className="text-green-500" /> : <Circle size={14} className="text-red-300" />}
                          <span className="text-text-secondary">Attempt {a.attempt}</span>
                          <span className={`font-bold ${a.passed ? "text-green-600" : "text-red-500"}`}>{a.score}%</span>
                          <span className={`text-xs ${a.passed ? "text-green-600" : "text-red-500"}`}>{a.passed ? "PASSED" : "FAILED"}</span>
                          <span className="ml-auto text-xs text-text-secondary">{formatDate(a.date)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {detail.examAttempts.length === 0 && (
                  <p className="text-xs text-text-secondary">Exam not attempted yet.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
