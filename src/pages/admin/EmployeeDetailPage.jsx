import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Circle, Clock, Award, RotateCcw, RefreshCcw } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { RoleBadge } from "../../components/ui/Badge";
import { ProgressBar } from "../../components/ui/Progress";
import { useToast } from "../../components/ui/Toast";
import { MOCK_EMPLOYEES, MOCK_MODULES, MOCK_LESSONS } from "../../lib/mockData";
import { formatDate, formatTimeAgo, formatDuration } from "../../lib/utils";

// Simulated detail data
const DETAIL_PROGRESS = {
  mod1: {
    lessonProgress: { les1: { completed: true, timeSpent: 720 }, les2: { completed: true, timeSpent: 480 }, les3: { completed: false, timeSpent: 120 } },
    examAttempts: [
      { attempt: 1, score: 55, passed: false, date: Date.now() - 5 * 86400000 },
      { attempt: 2, score: 85, passed: true, date: Date.now() - 3 * 86400000 },
    ],
  },
  mod2: {
    lessonProgress: { les4: { completed: true, timeSpent: 300 }, les5: { completed: false, timeSpent: 60 } },
    examAttempts: [],
  },
};

export default function EmployeeDetailPage() {
  const { empId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const emp = MOCK_EMPLOYEES.find((e) => e._id === empId) || MOCK_EMPLOYEES[0];

  return (
    <div className="p-4 md:p-6 w-full">
      <button onClick={() => navigate("/admin/learners")} className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to Learners
      </button>

      {/* Profile card */}
      <div className="bg-white rounded-card shadow-card p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-primary text-xl font-bold">{emp.name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-semibold text-text-primary">{emp.name}</h1>
              <RoleBadge role={emp.role} />
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${emp.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {emp.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
              {emp.email && <span>{emp.email}</span>}
              {emp.phone && <span>{emp.phone}</span>}
              <span>Joined {formatDate(emp.createdAt)}</span>
              <span>Last login {formatTimeAgo(emp.lastLoginAt)}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm">Edit</Button>
            <Button variant="danger-outline" size="sm">Deactivate</Button>
          </div>
        </div>
      </div>

      {/* Module progress detail */}
      <div className="space-y-4">
        {MOCK_MODULES.filter((m) => m.status === "published").map((mod) => {
          const detail = DETAIL_PROGRESS[mod._id];
          const lessons = MOCK_LESSONS[mod._id] || [];
          if (!detail) return null;

          const totalTime = Object.values(detail.lessonProgress).reduce((a, p) => a + p.timeSpent, 0);
          const completedLessons = Object.values(detail.lessonProgress).filter((p) => p.completed).length;
          const pct = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;
          const passed = detail.examAttempts.some((a) => a.passed);

          return (
            <div key={mod._id} className="bg-white rounded-card shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-text-primary">{mod.title}</h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {completedLessons}/{lessons.length} lessons · {formatDuration(totalTime)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="xs" onClick={() => toast.success("Retakes reset!")}>
                    <RotateCcw size={12} /> Reset Retakes
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => toast.success("Progress reset!")}>
                    <RefreshCcw size={12} /> Reset Progress
                  </Button>
                </div>
              </div>

              {/* Lesson-by-lesson */}
              <div className="px-5 py-3">
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
                            <Clock size={9} />{formatDuration(p.timeSpent)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Exam attempts */}
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Exam Attempts</h3>
                {detail.examAttempts.length === 0 ? (
                  <p className="text-xs text-text-secondary">No attempts yet.</p>
                ) : (
                  <div className="space-y-1">
                    {detail.examAttempts.map((attempt) => (
                      <div key={attempt.attempt} className={`flex items-center gap-3 p-2.5 rounded text-sm ${attempt.passed ? "bg-green-50" : "bg-red-50"}`}>
                        {attempt.passed ? (
                          <CheckCircle size={14} className="text-green-500 shrink-0" />
                        ) : (
                          <Circle size={14} className="text-red-300 shrink-0" />
                        )}
                        <span className="text-text-secondary">Attempt {attempt.attempt}</span>
                        <span className={`font-semibold ${attempt.passed ? "text-green-600" : "text-red-500"}`}>
                          {attempt.score}%
                        </span>
                        <span className={`text-xs font-medium ${attempt.passed ? "text-green-600" : "text-red-500"}`}>
                          {attempt.passed ? "PASSED" : "FAILED"}
                        </span>
                        <span className="ml-auto text-xs text-text-secondary">{formatDate(attempt.date)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {passed && (
                  <div className="mt-3 flex items-center gap-2 p-2.5 bg-primary-50 rounded">
                    <Award size={16} className="text-primary" />
                    <span className="text-sm font-medium text-primary">Certificate Issued</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
