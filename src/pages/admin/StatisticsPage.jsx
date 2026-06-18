import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import {
  Download,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { ProgressBar } from "../../components/ui/Progress";
import { useConvexSession } from "../../hooks/useConvexSession";
import { formatTimeAgo } from "../../lib/utils";
import { LeaderboardCard } from "../../components/leaderboard/LeaderboardCard";
import { StatCard } from "../../components/ui/StatCard";
import { MetricLabel } from "../../components/ui/MetricTooltip";
import {
  LEARNER_CATEGORIES,
  getLearnerCategoryLabel,
} from "../../lib/learnerCategories";

const ALL_CATEGORIES = "";

export default function StatisticsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { convexUser } = useConvexSession();
  const orgId = convexUser?.organizationId;

  const [programId, setProgramId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);

  const programs = useQuery(
    api.trainingPrograms.listForOrg,
    orgId ? { organizationId: orgId } : "skip"
  );

  const publishedPrograms = useMemo(
    () => (programs ?? []).filter((p) => p.status === "published"),
    [programs]
  );

  useEffect(() => {
    if (!programId && publishedPrograms.length > 0) {
      const preferred =
        publishedPrograms.find((p) => p.learnerReady) ?? publishedPrograms[0];
      setProgramId(preferred._id);
    }
  }, [programId, publishedPrograms]);

  const learnerCategoryKey =
    categoryFilter === ALL_CATEGORIES ? undefined : categoryFilter;

  const stats = useQuery(
    api.stats.getProgramStats,
    orgId && programId
      ? {
          organizationId: orgId,
          programId,
          learnerCategoryKey,
        }
      : "skip"
  );

  if (!programs) {
    return (
      <div className="p-6 text-center text-text-secondary">
        {t("common.loading")}
      </div>
    );
  }

  if (publishedPrograms.length === 0) {
    return (
      <div className="p-6 text-center text-text-secondary">
        {t("admin.statsNoPublishedProgram")}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center text-text-secondary">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full space-y-6">
      <div className="bg-white rounded-card shadow-card p-4 md:p-5 space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">
            {t("admin.statisticsTitle")}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {stats.program.title}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label={t("admin.statsFilterProgram")}
            value={programId ?? ""}
            onChange={(e) => setProgramId(e.target.value)}
          >
            {publishedPrograms.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
              </option>
            ))}
          </Select>
          <Select
            label={t("admin.statsFilterCategory")}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value={ALL_CATEGORIES}>{t("admin.statsAllLearners")}</option>
            {LEARNER_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {getLearnerCategoryLabel(c.key, i18n.language)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {stats.categoryStats.length > 0 && (
        <div className="bg-white rounded-card shadow-card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-text-primary">
              {t("admin.learnerCategoriesTitle")}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {t("admin.learnerCategoriesProgramHint")}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
            {stats.categoryStats
              .filter((row) => row.key !== "uncategorized")
              .map((row) => (
              <button
                key={row.key}
                type="button"
                onClick={() => setCategoryFilter(row.key)}
                className={`p-4 rounded-lg text-left transition-colors ${
                  categoryFilter === row.key
                    ? "bg-primary-50 ring-2 ring-primary"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <p className="text-sm font-semibold text-text-primary">
                  <MetricLabel tooltip={t("tooltips.admin.categoryTotal")}>
                    {getLearnerCategoryLabel(row.key, i18n.language)}
                  </MetricLabel>
                </p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {row.total}
                </p>
                <p className="text-xs text-text-secondary mt-2">
                  {row.completed} {t("status.completed").toLowerCase()} ·{" "}
                  {row.inProgress} {t("status.in_progress").toLowerCase()} ·{" "}
                  {row.notStarted} {t("status.not_started").toLowerCase()}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          variant="compact"
          label={t("admin.activeLearners")}
          tooltip={t("tooltips.admin.enrolledLearners")}
          value={stats.enrolledLearners}
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <StatCard
          variant="compact"
          label={t("admin.completionRate")}
          tooltip={t("tooltips.admin.programCompletionRate")}
          value={`${stats.completionRate}%`}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          variant="compact"
          label={t("admin.avgTimeModule")}
          tooltip={t("tooltips.admin.avgTimeModule")}
          value={stats.avgTimePerModule}
          icon={TrendingUp}
          color="bg-secondary"
        />
      </div>

      <LeaderboardCard
        mode="staff"
        programId={programId}
        learnerCategoryKey={learnerCategoryKey}
      />

      <div className="bg-white rounded-card shadow-card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-text-primary">
            {t("admin.moduleStatisticsTitle")}
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {t("admin.moduleStatisticsProgramHint", {
              count: stats.modulesInProgram,
            })}
          </p>
        </div>
        <div className="divide-y divide-gray-50">
          {stats.moduleStats.length === 0 ? (
            <p className="px-5 py-8 text-sm text-text-secondary text-center">
              {t("admin.statsNoModulesInProgram")}
            </p>
          ) : (
            stats.moduleStats.map((m) => {
              const passRate =
                m.started > 0 ? Math.round((m.passed / m.started) * 100) : 0;

              return (
              <div key={m.moduleId} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      {m.title}
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {t("admin.moduleStatsStarted", { count: m.started })} ·{" "}
                      {t("admin.moduleStatsAvgAttempts", {
                        count: m.avgAttempts,
                      })}
                    </p>
                  </div>
                  <MetricLabel
                    tooltip={t("tooltips.admin.moduleAvgScore")}
                    className="text-lg font-bold text-primary"
                  >
                    {m.avgScore}%
                  </MetricLabel>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  {[
                    {
                      label: t("admin.moduleStatsStartedLabel"),
                      tooltip: t("tooltips.admin.moduleStarted"),
                      value: m.started,
                      icon: Clock,
                      color: "text-blue-500",
                    },
                    {
                      label: t("admin.moduleStatsLessonsDone"),
                      tooltip: t("tooltips.admin.lessonsCompleted"),
                      value: m.completedLessons,
                      icon: CheckCircle,
                      color: "text-primary",
                    },
                    {
                      label: t("admin.moduleStatsPassed"),
                      tooltip: t("tooltips.admin.modulePassed"),
                      value: m.passed,
                      icon: CheckCircle,
                      color: "text-green-500",
                    },
                    {
                      label: t("admin.moduleStatsFailed"),
                      tooltip: t("tooltips.admin.moduleFailed"),
                      value: m.failed,
                      icon: XCircle,
                      color: "text-red-400",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="text-center p-2 bg-gray-50 rounded-lg"
                    >
                      <stat.icon
                        size={14}
                        className={`mx-auto mb-1 ${stat.color}`}
                      />
                      <p className="text-lg font-bold text-text-primary">
                        {stat.value}
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        <MetricLabel tooltip={stat.tooltip}>{stat.label}</MetricLabel>
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-text-secondary mb-1 text-right">
                  <MetricLabel tooltip={t("tooltips.admin.modulePassRate")}>
                    {t("admin.modulePassRate", { rate: passRate })}
                  </MetricLabel>
                </p>
                <ProgressBar
                  value={m.passed}
                  max={m.started || 1}
                  size="sm"
                  color="success"
                />
              </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-white rounded-card shadow-card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">
            {t("admin.learnerProgressTitle")}
          </h2>
          <Button variant="outline" size="sm">
            <Download size={14} /> {t("admin.exportCsv")}
          </Button>
        </div>
        <div className="divide-y divide-gray-50">
          {stats.recentLearners.length === 0 ? (
            <p className="px-5 py-8 text-sm text-text-secondary text-center">
              {t("admin.statsNoLearnersInFilter")}
            </p>
          ) : (
            stats.recentLearners.map((row) => (
              <div
                key={row._id}
                className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/admin/learners/${row._id}`)}
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <span className="text-primary text-xs font-semibold">
                    {row.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {row.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {row.learnerCategoryKey &&
                      `${getLearnerCategoryLabel(row.learnerCategoryKey, i18n.language)} · `}
                    {t("admin.lastActive")}{" "}
                    {formatTimeAgo(row.lastLoginAt)}
                  </p>
                </div>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
