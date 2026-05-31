import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConvexSession } from "../../hooks/useConvexSession";
import { LeaderboardCard } from "../../components/leaderboard/LeaderboardCard";

export default function LeadStatisticsPage() {
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
    return <div className="p-6 text-center text-text-secondary">Loading…</div>;
  }

  return (
    <div className="p-4 md:p-6 w-full space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Team size", value: learners.length },
          { label: "Completed all", value: completedCount },
          { label: "In progress", value: inProgressCount },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-card shadow-card p-4 text-center">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-text-secondary">{s.label}</p>
          </div>
        ))}
      </div>

      <LeaderboardCard mode="staff" />

      <div className="bg-white rounded-card shadow-card p-5">
        <h2 className="text-base font-semibold mb-4">Team breakdown</h2>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-text-secondary">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
            <p className="text-text-secondary">In progress</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-400">{notStartedCount}</p>
            <p className="text-text-secondary">Not started</p>
          </div>
        </div>
      </div>
    </div>
  );
}
