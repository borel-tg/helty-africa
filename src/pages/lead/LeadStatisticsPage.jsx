import { useTranslation } from "react-i18next";
import { Users, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { LeaderboardCard } from "../../components/leaderboard/LeaderboardCard";

/** Demo: learners assigned to the current lead (matches LeadDashboard). */
const LEAD_LEARNERS = [
  { _id: "user_learner", moduleProgress: { mod1: "completed", mod2: "in_progress" } },
  { _id: "user_learner2", moduleProgress: { mod1: "in_progress", mod2: "not_started" } },
  { _id: "user_learner3", moduleProgress: { mod1: "completed", mod2: "completed" } },
];

/**
 * Lead statistics — team KPIs and organization activity leaderboard.
 * Scoped team filters will apply when Convex replaces mock data.
 */
export default function LeadStatisticsPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  const completedCount = LEAD_LEARNERS.filter((l) =>
    Object.values(l.moduleProgress).every((s) => s === "completed")
  ).length;
  const inProgressCount = LEAD_LEARNERS.filter((l) =>
    Object.values(l.moduleProgress).some((s) => s === "in_progress")
  ).length;

  return (
    <div className="p-4 md:p-6 w-full space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">
          {t("lead.statsTitle")}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          {t("lead.statsSubtitle", { name: currentUser?.name?.split(" ")[0] })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            label: t("lead.teamLearners"),
            value: LEAD_LEARNERS.length,
            icon: Users,
            color: "bg-blue-500",
          },
          {
            label: t("lead.teamCompleted"),
            value: completedCount,
            icon: CheckCircle,
            color: "bg-green-500",
          },
          {
            label: t("lead.teamInProgress"),
            value: inProgressCount,
            icon: Clock,
            color: "bg-secondary",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-card shadow-card p-5">
            <div
              className={`w-8 h-8 rounded-lg ${s.color} mb-3 flex items-center justify-center`}
            >
              <s.icon size={16} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{s.value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <LeaderboardCard mode="lead" />
    </div>
  );
}
