import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { Users, CheckCircle, Clock, XCircle, ChevronRight, Search } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import { useConvexSession } from "../../hooks/useConvexSession";
import { ProgressBar } from "../../components/ui/Progress";
import { StatCard } from "../../components/ui/StatCard";
import { formatTimeAgo } from "../../lib/utils";

export default function LeadDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { convexUser } = useConvexSession();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const STATUS_FILTERS = [
    { id: "all", labelKey: "lead.filterAll" },
    { id: "not_started", labelKey: "lead.filterNotStarted" },
    { id: "in_progress", labelKey: "lead.filterInProgress" },
    { id: "completed", labelKey: "lead.filterCompleted" },
  ];

  const STATUS_ICON = {
    completed: <CheckCircle size={14} className="text-green-500" />,
    in_progress: <Clock size={14} className="text-blue-500" />,
    not_started: <XCircle size={14} className="text-gray-300" />,
  };

  const teamData = useQuery(
    api.stats.getLeadTeamOverview,
    convexUser?._id && convexUser?.organizationId
      ? { leadId: convexUser._id, organizationId: convexUser.organizationId }
      : "skip"
  );

  const learners = teamData?.learners ?? [];
  const publishedModules = teamData?.modules ?? [];

  const filtered = learners.filter((l) => {
    const matchSearch =
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase());
    if (filter === "all") return matchSearch;
    if (filter === "completed")
      return (
        matchSearch &&
        Object.values(l.moduleProgress).every((s) => s === "completed")
      );
    if (filter === "not_started")
      return (
        matchSearch &&
        Object.values(l.moduleProgress).every((s) => s === "not_started")
      );
    if (filter === "in_progress")
      return (
        matchSearch &&
        Object.values(l.moduleProgress).some((s) => s === "in_progress")
      );
    return matchSearch;
  });

  const completedCount = learners.filter((l) =>
    Object.values(l.moduleProgress).every((s) => s === "completed")
  ).length;
  const inProgressCount = learners.filter((l) =>
    Object.values(l.moduleProgress).some((s) => s === "in_progress")
  ).length;

  if (!teamData) {
    return (
      <div className="p-6 text-center text-text-secondary">{t("common.loading")}</div>
    );
  }

  const statCards = [
    {
      labelKey: "lead.teamLearners",
      tooltipKey: "tooltips.lead.teamLearners",
      value: learners.length,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      labelKey: "lead.teamCompleted",
      tooltipKey: "tooltips.lead.teamCompleted",
      value: completedCount,
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      labelKey: "lead.teamInProgress",
      tooltipKey: "tooltips.lead.teamInProgress",
      value: inProgressCount,
      icon: Clock,
      color: "text-secondary",
      bg: "bg-secondary-50",
    },
  ];

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary">
          {t("learner.hello", { name: currentUser?.name?.split(" ")[0] ?? "" })}
        </h2>
        <p className="text-text-secondary mt-1">{t("lead.teamProgressSubtitle")}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {statCards.map((s) => (
          <StatCard
            key={s.labelKey}
            variant="centered"
            label={t(s.labelKey)}
            tooltip={t(s.tooltipKey)}
            value={s.value}
            icon={s.icon}
            color={s.color}
            iconClassName={s.bg}
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder={t("lead.searchLearnersPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`text-xs font-medium px-3 py-2 rounded-md transition-colors whitespace-nowrap ${
                filter === f.id
                  ? "bg-white shadow-sm text-text-primary"
                  : "text-text-secondary"
              }`}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-card shadow-card">
            <Users size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-text-secondary">{t("lead.noLearnersMatch")}</p>
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
                  <span className="text-primary font-semibold">
                    {learner.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">
                    {learner.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {t("lead.lastActive", {
                      time: formatTimeAgo(learner.lastLoginAt),
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    {learner.overallPct}%
                  </p>
                  <p className="text-[10px] text-text-secondary">{t("lead.overall")}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </div>

              <ProgressBar value={learner.overallPct} size="sm" className="mb-3" />

              <div className="flex gap-3 flex-wrap">
                {publishedModules.map((mod) => {
                  const status = learner.moduleProgress[mod._id] || "not_started";
                  return (
                    <div key={mod._id} className="flex items-center gap-1">
                      {STATUS_ICON[status]}
                      <span className="text-[10px] text-text-secondary truncate max-w-[80px]">
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
