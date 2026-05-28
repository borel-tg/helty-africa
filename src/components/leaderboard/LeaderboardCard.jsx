import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Trophy, BookOpen, Award, ChevronDown } from "lucide-react";
import { Card, CardBody } from "../ui/Card";
import { cn } from "../../lib/utils";
import {
  LEADERBOARD_PERIODS,
  LEADERBOARD_COLLAPSED_LIMIT,
} from "../../lib/leaderboard/constants";
import { useOrgLeaderboard } from "../../hooks/useOrgLeaderboard";
import { LearnerAvatar } from "../learner/LearnerAvatar";

const PERIOD_OPTIONS = [
  { id: LEADERBOARD_PERIODS.WEEK, labelKey: "leaderboard.periodWeek" },
  { id: LEADERBOARD_PERIODS.TODAY, labelKey: "leaderboard.periodToday" },
];

const RANK_STYLES = {
  1: "text-amber-500 font-bold",
  2: "text-slate-400 font-semibold",
  3: "text-amber-700 font-semibold",
};

function RankBadge({ rank }) {
  if (rank <= 3) {
    return (
      <span className={cn("text-sm w-6 text-center tabular-nums", RANK_STYLES[rank])}>
        {rank}
      </span>
    );
  }
  return <span className="text-sm w-6 text-center text-text-secondary tabular-nums">{rank}</span>;
}

function ActivitySummary({ entry, t }) {
  const parts = [];
  if (entry.lessonsCount > 0) {
    parts.push(t("leaderboard.lessonsShort", { count: entry.lessonsCount }));
  }
  if (entry.modulesPassed > 0) {
    parts.push(t("leaderboard.modulesShort", { count: entry.modulesPassed }));
  }
  if (parts.length === 0) {
    return (
      <span className="text-xs text-text-secondary">{t("leaderboard.noActivityYet")}</span>
    );
  }
  return <span className="text-xs text-text-secondary">{parts.join(" · ")}</span>;
}

function LeaderboardRow({ entry, isViewer, t }) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 py-2.5 px-2 rounded-lg transition-colors",
        isViewer && "bg-primary-50"
      )}
    >
      <RankBadge rank={entry.rank} />
      <LearnerAvatar userId={entry.userId} size={40} highlight={isViewer} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {entry.displayName}
          {isViewer && (
            <span className="ml-1.5 text-xs font-normal text-primary">
              ({t("leaderboard.you")})
            </span>
          )}
        </p>
        <ActivitySummary entry={entry} t={t} />
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-text-primary tabular-nums">
          {t("leaderboard.pointsLabel", { count: entry.points })}
        </p>
      </div>
    </li>
  );
}

function LeaderboardList({ entries, viewerId, t, className }) {
  if (entries.length === 0) return null;
  return (
    <ol className={cn("divide-y divide-gray-100", className)}>
      {entries.map((entry) => (
        <LeaderboardRow
          key={entry.userId}
          entry={entry}
          isViewer={entry.userId === viewerId}
          t={t}
        />
      ))}
    </ol>
  );
}

/**
 * Live organization leaderboard (this week / today) with animal avatars.
 *
 * @param {"learner"|"staff"|"lead"} [mode="learner"]
 *   - learner: top 2 by default, expandable to full top 5; personal rank footer
 *   - staff: full top 5 on admin statistics
 *   - lead: full top 5 on lead statistics (team context subtitle)
 */
export function LeaderboardCard({ mode = "learner" }) {
  const { t } = useTranslation();
  const isLearnerView = mode === "learner";
  const subtitleKey =
    mode === "lead"
      ? "leaderboard.subtitleLead"
      : isLearnerView
        ? "leaderboard.subtitleLearner"
        : "leaderboard.subtitleStaff";
  const expandPanelId = useId();
  const [expanded, setExpanded] = useState(false);
  const { period, setPeriod, data } = useOrgLeaderboard({
    highlightViewer: isLearnerView,
  });

  // Collapse when switching week / today
  useEffect(() => {
    setExpanded(false);
  }, [period]);

  if (!data) return null;

  const viewerId = isLearnerView ? data.viewer?.userId : null;
  const useCollapse = isLearnerView && !data.hidden;
  const topEntries = useCollapse
    ? data.entries.slice(0, LEADERBOARD_COLLAPSED_LIMIT)
    : data.entries;
  const restEntries = useCollapse
    ? data.entries.slice(LEADERBOARD_COLLAPSED_LIMIT)
    : [];
  const canExpand = useCollapse && restEntries.length > 0;

  // Viewer row below top 5 (only when expanded on learner view)
  const showViewerRow =
    isLearnerView &&
    expanded &&
    data.viewer &&
    !data.viewer.inTop &&
    data.viewer.rank != null;

  return (
    <Card className="mb-6 overflow-hidden">
      <CardBody className="p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-secondary-50 flex items-center justify-center">
              <Trophy size={18} className="text-secondary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                {t("leaderboard.title")}
              </h3>
              <p className="text-xs text-text-secondary">{t(subtitleKey)}</p>
            </div>
          </div>

          <div
            className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 self-start"
            role="tablist"
            aria-label={t("leaderboard.periodLabel")}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={period === opt.id}
                onClick={() => setPeriod(opt.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  period === opt.id
                    ? "bg-white text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-text-secondary mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <BookOpen size={12} aria-hidden />
            {t("leaderboard.legendLesson")}
          </span>
          <span className="inline-flex items-center gap-1">
            <Award size={12} aria-hidden />
            {t("leaderboard.legendModule")}
          </span>
        </p>

        {data.hidden ? (
          <p className="text-sm text-text-secondary text-center py-6 px-2">
            {data.totalActiveLearners < data.minLearnersRequired
              ? t("leaderboard.tooFewLearners")
              : t("leaderboard.notEnoughActivity")}
          </p>
        ) : (
          <>
            <LeaderboardList entries={topEntries} viewerId={viewerId} t={t} />

            {canExpand && (
              <>
                <div
                  id={expandPanelId}
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-in-out",
                    expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden min-h-0">
                    <LeaderboardList
                      entries={restEntries}
                      viewerId={viewerId}
                      t={t}
                      className="border-t border-gray-100"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={expandPanelId}
                  onClick={() => setExpanded((v) => !v)}
                  className={cn(
                    "mt-2 w-full flex items-center justify-center gap-1.5 py-2 text-sm font-medium",
                    "text-primary hover:text-primary-700 transition-colors rounded-lg hover:bg-primary-50"
                  )}
                >
                  {expanded
                    ? t("leaderboard.showLess")
                    : t("leaderboard.viewAllCount", { count: restEntries.length })}
                  <ChevronDown
                    size={16}
                    className={cn(
                      "transition-transform duration-300",
                      expanded && "rotate-180"
                    )}
                    aria-hidden
                  />
                </button>
              </>
            )}

            {showViewerRow && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <LeaderboardRow
                  entry={{
                    rank: data.viewer.rank,
                    userId: data.viewer.userId,
                    displayName: data.viewer.displayName,
                    points: data.viewer.points,
                    lessonsCount: data.viewer.lessonsCount,
                    modulesPassed: data.viewer.modulesPassed,
                  }}
                  isViewer
                  t={t}
                />
              </div>
            )}

            {isLearnerView && data.viewer?.rank != null && (
              <p className="text-xs text-text-secondary text-center mt-4">
                {t("leaderboard.yourRankFooter", {
                  rank: data.viewer.rank,
                  total: data.totalActiveLearners,
                })}
              </p>
            )}

            {!isLearnerView && (
              <p className="text-xs text-text-secondary text-center mt-4">
                {t("leaderboard.staffFooter", { total: data.totalActiveLearners })}
              </p>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
