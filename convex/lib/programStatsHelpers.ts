import type { QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { LEARNER_CATEGORY_KEYS, isLearnerCategoryKey } from "./learnerCategories";

export type LearnerCategoryFilter =
  | "national"
  | "provincial"
  | "zonal"
  | "uncategorized";

export function getCategoryBucketKey(
  learner: Doc<"users">
): LearnerCategoryFilter {
  if (isLearnerCategoryKey(learner.learnerCategoryKey)) {
    return learner.learnerCategoryKey;
  }
  return "uncategorized";
}

export function matchesCategoryFilter(
  learner: Doc<"users">,
  filter: LearnerCategoryFilter | undefined
): boolean {
  if (!filter) return true;
  return getCategoryBucketKey(learner) === filter;
}

export async function getProgramPublishedModules(
  ctx: QueryCtx,
  programId: Id<"trainingPrograms">,
  organizationId: Id<"organizations">
) {
  const links = await ctx.db
    .query("trainingProgramModules")
    .withIndex("by_program_order", (q) => q.eq("programId", programId))
    .collect();

  const modules: (Doc<"modules"> & { programOrder: number })[] = [];
  for (const link of links) {
    const mod = await ctx.db.get(link.moduleId);
    if (
      mod &&
      mod.organizationId === organizationId &&
      mod.status === "published"
    ) {
      modules.push({ ...mod, programOrder: link.order });
    }
  }
  return modules.sort((a, b) => a.programOrder - b.programOrder);
}

/** Active learners enrolled in the program. */
export async function getEnrolledActiveLearners(
  ctx: QueryCtx,
  programId: Id<"trainingPrograms">,
  organizationId: Id<"organizations">
): Promise<Doc<"users">[]> {
  const enrollments = await ctx.db
    .query("programEnrollments")
    .withIndex("by_program", (q) => q.eq("programId", programId))
    .collect();

  const learners: Doc<"users">[] = [];
  for (const enrollment of enrollments) {
    if (enrollment.organizationId !== organizationId) continue;
    const user = await ctx.db.get(enrollment.userId);
    if (
      user &&
      user.organizationId === organizationId &&
      user.role === "learner" &&
      user.status === "active"
    ) {
      learners.push(user);
    }
  }
  return learners;
}

export function buildCategoryBuckets() {
  const buckets: Record<
    string,
    {
      key: string;
      total: number;
      completed: number;
      inProgress: number;
      notStarted: number;
    }
  > = {};
  for (const key of LEARNER_CATEGORY_KEYS) {
    buckets[key] = { key, total: 0, completed: 0, inProgress: 0, notStarted: 0 };
  }
  buckets.uncategorized = {
    key: "uncategorized",
    total: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
  };
  return buckets;
}

export async function learnerProgramStatus(
  ctx: QueryCtx,
  learnerId: Id<"users">,
  programId: Id<"trainingPrograms">,
  moduleIds: Id<"modules">[]
): Promise<"completed" | "in_progress" | "not_started"> {
  const enrollment = await ctx.db
    .query("programEnrollments")
    .withIndex("by_user_program", (q) =>
      q.eq("userId", learnerId).eq("programId", programId)
    )
    .unique();

  if (enrollment?.passed) return "completed";

  for (const moduleId of moduleIds) {
    const attempts = await ctx.db
      .query("examAttempts")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", learnerId).eq("moduleId", moduleId)
      )
      .collect();
    if (attempts.some((a) => a.submittedAt != null)) return "in_progress";

    const progress = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", learnerId).eq("moduleId", moduleId)
      )
      .collect();
    if (progress.some((p) => p.completed)) return "in_progress";
  }

  return "not_started";
}
