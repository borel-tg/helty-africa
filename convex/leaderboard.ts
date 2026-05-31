import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { learnerCategoryKeyValidator } from "./lib/learnerCategories";
import {
  getEnrolledActiveLearners,
  getProgramPublishedModules,
  matchesCategoryFilter,
  type LearnerCategoryFilter,
} from "./lib/programStatsHelpers";

/** Points awarded per lesson completed within the leaderboard period. */
const POINTS_PER_LESSON = 1;
/** Points awarded per module passed (exam) within the period — once per module. */
const POINTS_PER_MODULE_PASS = 5;

const MIN_LEARNERS_TO_SHOW = 3;

type Period = "week" | "today";

function getPeriodStart(period: Period, now = Date.now()): number {
  if (period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  }
  return now - 7 * 24 * 60 * 60 * 1000;
}

/** "Fatima Coulibaly" → "Fatima C." for privacy-friendly leaderboard rows. */
export function formatDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}

type LearnerScore = {
  userId: Id<"users">;
  name: string;
  displayName: string;
  points: number;
  lessonsCount: number;
  modulesPassed: number;
  latestActivity: number;
};

async function scoreLearnerInPeriod(
  ctx: QueryCtx,
  learner: Doc<"users">,
  organizationId: Id<"organizations">,
  since: number,
  programModuleIds?: Set<string>
): Promise<LearnerScore> {
  let points = 0;
  let lessonsCount = 0;
  let modulesPassed = 0;
  let latestActivity = 0;

  const lessonRows = await ctx.db
    .query("lessonProgress")
    .filter((q) =>
      q.and(
        q.eq(q.field("userId"), learner._id),
        q.eq(q.field("organizationId"), organizationId),
        q.eq(q.field("completed"), true)
      )
    )
    .collect();

  for (const row of lessonRows) {
    if (
      programModuleIds &&
      !programModuleIds.has(row.moduleId as string)
    ) {
      continue;
    }
    const completedAt = row.completedAt ?? row.lastAccessedAt ?? 0;
    if (completedAt >= since) {
      points += POINTS_PER_LESSON;
      lessonsCount += 1;
      latestActivity = Math.max(latestActivity, completedAt);
    }
  }

  const attempts = await ctx.db
    .query("examAttempts")
    .filter((q) => q.eq(q.field("userId"), learner._id))
    .collect();

  const passedModules = new Set<string>();
  for (const attempt of attempts) {
    if (
      programModuleIds &&
      !programModuleIds.has(attempt.moduleId as string)
    ) {
      continue;
    }
    if (
      attempt.passed &&
      attempt.submittedAt &&
      attempt.submittedAt >= since &&
      !passedModules.has(attempt.moduleId)
    ) {
      passedModules.add(attempt.moduleId);
      points += POINTS_PER_MODULE_PASS;
      modulesPassed += 1;
      latestActivity = Math.max(latestActivity, attempt.submittedAt);
    }
  }

  return {
    userId: learner._id,
    name: learner.name,
    displayName: formatDisplayName(learner.name),
    points,
    lessonsCount,
    modulesPassed,
    latestActivity,
  };
}

/** Standard competition ranking: tied scores share the same rank number. */
function assignRanks(sorted: LearnerScore[]) {
  let rank = 0;
  let prevPoints: number | null = null;
  return sorted.map((entry, index) => {
    if (prevPoints !== entry.points) {
      rank = index + 1;
      prevPoints = entry.points;
    }
    return { ...entry, rank };
  });
}

/**
 * Organization leaderboard for learners — top N for the current week or today.
 * Scoped by organizationId; callers must verify the viewer belongs to that org.
 */
const learnerCategoryFilterValidator = v.optional(
  v.union(learnerCategoryKeyValidator, v.literal("uncategorized"))
);

export const getOrgLeaderboard = query({
  args: {
    organizationId: v.id("organizations"),
    viewerUserId: v.id("users"),
    period: v.union(v.literal("week"), v.literal("today")),
    limit: v.optional(v.number()),
    /** When set, only enrolled learners in this program; points scoped to program modules. */
    programId: v.optional(v.id("trainingPrograms")),
    learnerCategoryKey: learnerCategoryFilterValidator,
  },
  handler: async (ctx, args) => {
    const since = getPeriodStart(args.period);
    const limit = args.limit ?? 5;
    const categoryFilter = args.learnerCategoryKey as
      | LearnerCategoryFilter
      | undefined;

    let learners: Doc<"users">[];
    let programModuleIds: Set<string> | undefined;

    if (args.programId) {
      const program = await ctx.db.get(args.programId);
      if (!program || program.organizationId !== args.organizationId) {
        throw new Error("Program not found");
      }
      const modules = await getProgramPublishedModules(
        ctx,
        args.programId,
        args.organizationId
      );
      programModuleIds = new Set(modules.map((m) => m._id as string));
      learners = await getEnrolledActiveLearners(
        ctx,
        args.programId,
        args.organizationId
      );
      learners = learners.filter((l) =>
        matchesCategoryFilter(l, categoryFilter)
      );
    } else {
      const orgUsers = await ctx.db
        .query("users")
        .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
        .collect();

      learners = orgUsers.filter(
        (u) => u.role === "learner" && u.status === "active"
      );
      if (categoryFilter) {
        learners = learners.filter((l) =>
          matchesCategoryFilter(l, categoryFilter)
        );
      }
    }

    if (learners.length < MIN_LEARNERS_TO_SHOW) {
      return {
        period: args.period,
        since,
        totalActiveLearners: learners.length,
        minLearnersRequired: MIN_LEARNERS_TO_SHOW,
        hidden: true,
        entries: [],
        viewer: null,
      };
    }

    const scored: LearnerScore[] = [];
    for (const learner of learners) {
      scored.push(
        await scoreLearnerInPeriod(
          ctx,
          learner,
          args.organizationId,
          since,
          programModuleIds
        )
      );
    }

    scored.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.latestActivity - a.latestActivity;
    });

    const ranked = assignRanks(scored);
    const withActivity = ranked.filter((r) => r.points > 0);

    const viewerRow = ranked.find((r) => r.userId === args.viewerUserId);
    const viewerRankIndex = ranked.findIndex((r) => r.userId === args.viewerUserId);
    const viewerRank = viewerRankIndex >= 0 ? viewerRankIndex + 1 : null;

    return {
      period: args.period,
      since,
      totalActiveLearners: learners.length,
      minLearnersRequired: MIN_LEARNERS_TO_SHOW,
      hidden: withActivity.length < MIN_LEARNERS_TO_SHOW,
      entries: ranked.slice(0, limit).map((e) => ({
        rank: e.rank,
        userId: e.userId,
        displayName: e.displayName,
        points: e.points,
        lessonsCount: e.lessonsCount,
        modulesPassed: e.modulesPassed,
      })),
      viewer: viewerRow
        ? {
            rank: viewerRank,
            userId: viewerRow.userId,
            displayName: viewerRow.displayName,
            points: viewerRow.points,
            lessonsCount: viewerRow.lessonsCount,
            modulesPassed: viewerRow.modulesPassed,
            inTop: viewerRank !== null && viewerRank <= limit,
          }
        : null,
    };
  },
});
