import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, CheckCircle, Clock, XCircle, ChevronRight, Search } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { StatusBadge } from "../../components/ui/Badge";
import { ProgressBar } from "../../components/ui/Progress";
import { MOCK_EMPLOYEES, MOCK_MODULES } from "../../lib/mockData";
import { formatTimeAgo } from "../../lib/utils";

// Simulated data for assigned learners
const LEAD_LEARNERS = [
  {
    _id: "user_learner",
    name: "Fatima Coulibaly",
    email: "fatima@evtp.demo",
    phone: "+225 07 000 0004",
    status: "active",
    lastLoginAt: Date.now() - 43200000,
    moduleProgress: { mod1: "completed", mod2: "in_progress" },
    overallPct: 70,
  },
  {
    _id: "user_learner2",
    name: "Ibrahim Traoré",
    email: "ibrahim@evtp.demo",
    phone: "+226 70 000 0005",
    status: "active",
    lastLoginAt: Date.now() - 86400000,
    moduleProgress: { mod1: "in_progress", mod2: "not_started" },
    overallPct: 30,
  },
  {
    _id: "user_learner3",
    name: "Amina Diallo",
    email: "amina@evtp.demo",
    phone: "+221 76 000 0006",
    status: "active",
    lastLoginAt: Date.now() - 2 * 86400000,
    moduleProgress: { mod1: "completed", mod2: "completed" },
    overallPct: 100,
  },
];

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "not_started", label: "Not Started" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

const STATUS_ICON = {
  completed: <CheckCircle size={14} className="text-green-500" />,
  in_progress: <Clock size={14} className="text-blue-500" />,
  not_started: <XCircle size={14} className="text-gray-300" />,
};

export default function LeadDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const publishedModules = MOCK_MODULES.filter((m) => m.status === "published");

  const filtered = LEAD_LEARNERS.filter((l) => {
    const matchSearch =
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase());
    if (filter === "all") return matchSearch;
    if (filter === "completed")
      return matchSearch && Object.values(l.moduleProgress).every((s) => s === "completed");
    if (filter === "not_started")
      return matchSearch && Object.values(l.moduleProgress).every((s) => s === "not_started");
    if (filter === "in_progress")
      return matchSearch && Object.values(l.moduleProgress).some((s) => s === "in_progress");
    return matchSearch;
  });

  const completedCount = LEAD_LEARNERS.filter((l) =>
    Object.values(l.moduleProgress).every((s) => s === "completed")
  ).length;
  const inProgressCount = LEAD_LEARNERS.filter((l) =>
    Object.values(l.moduleProgress).some((s) => s === "in_progress")
  ).length;
  const notStartedCount = LEAD_LEARNERS.filter((l) =>
    Object.values(l.moduleProgress).every((s) => s === "not_started")
  ).length;

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary">
          Hello, {currentUser?.name?.split(" ")[0]} 👋
        </h2>
        <p className="text-text-secondary mt-1">
          Your team's training progress
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Learners", value: LEAD_LEARNERS.length, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Completed All", value: completedCount, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
          { label: "In Progress", value: inProgressCount, icon: Clock, color: "text-secondary", bg: "bg-secondary-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-card shadow-card p-4 text-center">
            <div className={`w-9 h-9 rounded-full ${s.bg} flex items-center justify-center mx-auto mb-2`}>
              <s.icon size={18} className={s.color} />
            </div>
            <p className="text-2xl font-bold text-text-primary">{s.value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search learners…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-input text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {STATUS_FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`text-xs font-medium px-3 py-2 rounded-md transition-colors whitespace-nowrap ${
                filter === f.id ? "bg-white shadow-sm text-text-primary" : "text-text-secondary"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Learner list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-card shadow-card">
            <Users size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-text-secondary">No learners match your filters.</p>
          </div>
        ) : (
          filtered.map((learner) => (
            <div
              key={learner._id}
              className="bg-white rounded-card shadow-card p-4 cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate(`/lead/learner/${learner._id}`)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <span className="text-primary font-semibold">{learner.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{learner.name}</p>
                  <p className="text-xs text-text-secondary">Last active {formatTimeAgo(learner.lastLoginAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{learner.overallPct}%</p>
                  <p className="text-[10px] text-text-secondary">overall</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </div>

              <ProgressBar value={learner.overallPct} size="sm" className="mb-3" />

              {/* Per-module status */}
              <div className="flex gap-3 flex-wrap">
                {publishedModules.map((mod) => {
                  const status = learner.moduleProgress[mod._id] || "not_started";
                  return (
                    <div key={mod._id} className="flex items-center gap-1">
                      {STATUS_ICON[status]}
                      <span className="text-xs text-text-secondary truncate max-w-[120px]">
                        {mod.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
