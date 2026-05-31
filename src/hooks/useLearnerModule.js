import { useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "./useAuth";
import { useConvexSession } from "./useConvexSession";

function computeProgress(lessons, isCompleted) {
  const total = lessons.length;
  const completedCount = lessons.filter((l) => isCompleted(l._id)).length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const allComplete = total > 0 && completedCount === total;

  let status = "not_started";
  if (allComplete) status = "ready_for_exam";
  else if (completedCount > 0) status = "in_progress";

  return { completedCount, total, pct, allComplete, status };
}

/** Module + lessons + resources + progress for learner module/lesson routes. */
export function useLearnerModule(moduleId) {
  const { currentUser } = useAuth();
  const { convexUser } = useConvexSession();
  const recordAccess = useMutation(api.recentModules.recordAccess);

  const convexModule = useQuery(
    api.modules.getById,
    moduleId ? { moduleId } : "skip"
  );

  const convexLessons = useQuery(
    api.lessons.listByModule,
    convexModule ? { moduleId } : "skip"
  );

  const convexResources = useQuery(
    api.moduleResources.listByModule,
    convexModule ? { moduleId } : "skip"
  );

  const needsUserData = Boolean(convexModule && convexUser?._id);

  const convexProgress = useQuery(
    api.progress.getModuleProgress,
    needsUserData ? { userId: convexUser._id, moduleId } : "skip"
  );

  const enrolledCtx = useQuery(
    api.recentModules.findEnrolledProgramForModule,
    needsUserData ? { userId: convexUser._id, moduleId } : "skip"
  );

  const convexExamQuestions = useQuery(
    api.exams.listQuestions,
    convexModule ? { moduleId } : "skip"
  );

  const module = convexModule;
  const lessons = convexLessons ?? [];
  const resources = convexResources ?? [];
  const program = enrolledCtx?.program ?? null;

  const completedLessonIds = useMemo(() => {
    const set = new Set();
    for (const row of convexProgress ?? []) {
      if (row.completed) set.add(row.lessonId);
    }
    return set;
  }, [convexProgress]);

  const isLessonCompleted = (lessonId) => completedLessonIds.has(lessonId);

  const progress = useMemo(
    () => computeProgress(lessons, isLessonCompleted),
    [lessons, completedLessonIds]
  );

  const isLoading =
    moduleId &&
    (convexModule === undefined ||
      (convexModule &&
        (convexLessons === undefined ||
          convexResources === undefined ||
          convexExamQuestions === undefined ||
          (needsUserData &&
            (convexProgress === undefined || enrolledCtx === undefined)))));

  const notFound = moduleId && convexModule === null;

  useEffect(() => {
    if (!moduleId || !module || !program || !convexUser?._id) return;

    recordAccess({
      userId: convexUser._id,
      moduleId,
      programId: program._id,
      organizationId: convexUser.organizationId,
    }).catch(() => {});
  }, [moduleId, module, program, convexUser, recordAccess]);

  return {
    module,
    lessons,
    resources,
    program,
    progress,
    isLessonCompleted,
    examQuestions: convexExamQuestions ?? [],
    isLoading,
    notFound,
    convexUser,
  };
}
