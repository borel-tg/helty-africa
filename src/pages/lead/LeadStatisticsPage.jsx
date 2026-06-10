import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConvexSession } from "../../hooks/useConvexSession";
import { LeaderboardCard } from "../../components/leaderboard/LeaderboardCard";

export default function LeadStatisticsPage() {
  const { t } = useTranslation();
  const { convexUser } = useConvexSession();

  const teamData = useQuery(
    api.stats.getLeadTeamOverview,
    convexUser?._id && convexUser?.organizationId
      ? { leadId: convexUser._id, organizationId: convexUser.organizationId }
      : "skip"
  );

  const learners = teamData?.learners ?? [];

  const completedCount = learners.filter((l) =>
    Object.values(l.moduleProgress).every((s) => s === "completed")
  ).length;
  const inProgressCount = learners.filter((l) =>
    Object.values(l.moduleProgress).some((s) => s === "in_progress")
  ).length;
  const notStartedCount = learners.filter((l) =>
    Object.values(l.moduleProgress).every((s) => s === "not_started")
  ).length;

  if (!teamData) {
    return (
      <div className="p-6 text-center text-text-secondary">{t("common.loading")}</div>
    );
  }

  const statCards = [
    { labelKey: "lead.teamSize", value: learners.length },
    { labelKey: "lead.completedAll", value: completedCount },
    { labelKey: "lead.teamInProgress", value: inProgressCount },
  ];

  const breakdown = [
    { labelKey: "status.completed", value: completedCount, color: "text-green-600" },
    { labelKey: "status.in_progress", value: inProgressCount, color: "text-blue-600" },
    { labelKey: "lead.notStarted", value: notStartedCount, color: "text-gray-400" },
  ];

  return (
    <div className="p-4 md:p-6 w-full space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((s) => (
          <div key={s.labelKey} className="bg-white rounded-card shadow-card p-4 text-center">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-text-secondary">{t(s.labelKey)}</p>
          </div>
        ))}
      </div>

      <LeaderboardCard mode="staff" />

      <div className="bg-white rounded-card shadow-card p-5">
        <h2 className="text-base font-semibold mb-4">{t("lead.teamBreakdown")}</h2>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          {breakdown.map((item) => (
            <div key={item.labelKey}>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-text-secondary">{t(item.labelKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
