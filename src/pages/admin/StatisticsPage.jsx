import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, ChevronRight, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/Progress";
import { StatusBadge } from "../../components/ui/Badge";
import { MOCK_STATS, MOCK_EMPLOYEES, MOCK_MODULES } from "../../lib/mockData";
import { formatTimeAgo } from "../../lib/utils";
import { LeaderboardCard } from "../../components/leaderboard/LeaderboardCard";

// Simulated per-employee module progress
const EMPLOYEE_MODULE_PROGRESS = [
  { empId: "user_learner", name: "Fatima Coulibaly", mod1: "completed", mod2: "in_progress", lastActivity: Date.now() - 43200000 },
  { empId: "user_learner2", name: "Ibrahim Traoré", mod1: "in_progress", mod2: "not_started", lastActivity: Date.now() - 86400000 },
  { empId: "user_learner3", name: "Amina Diallo", mod1: "completed", mod2: "completed", lastActivity: Date.now() - 2 * 86400000 },
  { empId: "user_learner4", name: "Kofi Boateng", mod1: "not_started", mod2: "not_started", lastActivity: Date.now() - 10 * 86400000 },
];

const statusDot = (status) => {
  const colors = { completed: "text-green-500", in_progress: "text-blue-500", not_started: "text-gray-300", failed: "text-red-500" };
  const labels = { completed: "Passed", in_progress: "In Progress", not_started: "Not Started", failed: "Failed" };
  return <span className={`text-xs ${colors[status]}`}>{labels[status]}</span>;
};

export default function StatisticsPage() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState("all");
  const stats = MOCK_STATS;

  return (
    <div className="p-4 md:p-6 w-full space-y-6">
      {/* Top-level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Learners", value: stats.totalEmployees, color: "bg-blue-500" },
          { label: "Modules Published", value: stats.totalModulesPublished, color: "bg-primary" },
          { label: "Overall Completion", value: `${stats.overallCompletionRate}%`, color: "bg-green-500" },
          { label: "Avg Time / Module", value: stats.avgTimePerModule, color: "bg-secondary" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-card shadow-card p-5">
            <div className={`w-8 h-8 rounded-lg ${s.color} mb-3 flex items-center justify-center`}>
              <TrendingUp size={16} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{s.value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <LeaderboardCard mode="staff" />

      {/* Per-module stats */}
      <div className="bg-white rounded-card shadow-card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-text-primary">Module Statistics</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {stats.moduleStats.map((m) => (
            <div key={m.moduleId} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{m.title}</h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {m.started} started · Avg {m.avgAttempts} attempts
                  </p>
                </div>
                <span className="text-lg font-bold text-primary">{m.avgScore}%</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {[
                  { label: "Started", value: m.started, icon: Clock, color: "text-blue-500" },
                  { label: "Lessons Done", value: m.completedLessons, icon: CheckCircle, color: "text-primary" },
                  { label: "Passed", value: m.passed, icon: CheckCircle, color: "text-green-500" },
                  { label: "Failed", value: m.failed, icon: XCircle, color: "text-red-400" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-2 bg-gray-50 rounded-lg">
                    <stat.icon size={14} className={`mx-auto mb-1 ${stat.color}`} />
                    <p className="text-lg font-bold text-text-primary">{stat.value}</p>
                    <p className="text-[10px] text-text-secondary">{stat.label}</p>
                  </div>
                ))}
              </div>
              <ProgressBar value={m.passed} max={m.started} size="sm" color="success" />
              <p className="text-xs text-text-secondary mt-1">
                {Math.round((m.passed / m.started) * 100)}% pass rate
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Learner roster */}
      <div className="bg-white rounded-card shadow-card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Learner Progress</h2>
          <Button variant="outline" size="sm">
            <Download size={14} /> Export CSV
          </Button>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-3 flex gap-2 border-b border-gray-50 overflow-x-auto">
          {["all", "not_started", "in_progress", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveModule(f)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                activeModule === f
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-text-secondary hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "All" : f === "not_started" ? "Not Started" : f === "in_progress" ? "In Progress" : "Completed"}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="divide-y divide-gray-50">
          {EMPLOYEE_MODULE_PROGRESS.map((row) => (
            <div
              key={row.empId}
              className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/admin/learners/${row.empId}`)}
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <span className="text-primary text-xs font-semibold">{row.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{row.name}</p>
                <p className="text-xs text-text-secondary">Last active {formatTimeAgo(row.lastActivity)}</p>
              </div>
              <div className="hidden sm:flex gap-4">
                {MOCK_MODULES.filter((m) => m.status === "published").map((mod) => (
                  <div key={mod._id} className="text-center">
                    <p className="text-[10px] text-text-secondary truncate max-w-[80px]">{mod.title.split(" ")[0]}</p>
                    {statusDot(row[mod._id] || "not_started")}
                  </div>
                ))}
              </div>
              <ChevronRight size={14} className="text-gray-300 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
