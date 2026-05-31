import { useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "./useAuth";
import { useConvexSession } from "./useConvexSession";
import { isConvexModuleId } from "../lib/convexIds";
import {
  recordRecentModule,
  getRecentStorageUserId,
} from "../lib/recentModules";
import { getProgramForModule } from "../lib/moduleProgram";
import {
  MOCK_MODULES,
  MOCK_LESSONS,
  MOCK_MODULE_RESOURCES,
  MOCK_LEARNER_PROGRESS,
  MOCK_PROGRAM_ENROLLMENTS,
  MOCK_EXAM_QUESTIONS,
} from "../lib/mockData";

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

/**
 * Module + lessons + resources + progress for learner module/lesson routes.
 * Supports Convex module ids and mock `mod*` ids.
 */
export function useLearnerModule(moduleId) {
  const { currentUser } = useAuth();
  const { convexUser, userLookup } = useConvexSession();
  const recordAccess = useMutation(api.recentModules.recordAccess);

  const useConvex = Boolean(moduleId && isConvexModuleId(moduleId));

  const convexModule = useQuery(
    api.modules.getById,
    useConvex ? { moduleId } : "skip"
  );

  const convexLessons = useQuery(
    api.lessons.listByModule,
    useConvex && convexModule ? { moduleId } : "skip"
  );

  const convexResources = useQuery(
    api.moduleResources.listByModule,
    useConvex && convexModule ? { moduleId } : "skip"
  );

  const needsUserData = Boolean(useConvex && convexModule && convexUser?._id);

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
    useConvex && convexModule ? { moduleId } : "skip"
  );

  const mockModule = MOCK_MODULES.find((m) => m._id === moduleId);
  const mockLessons = MOCK_LESSONS[moduleId] || [];
  const mockResources = MOCK_MODULE_RESOURCES[moduleId] || [];
  const mockProgram =
    mockModule && !useConvex ? getProgramForModule(moduleId) : null;

  const module = useConvex ? convexModule : mockModule;
  const lessons = useConvex ? (convexLessons ?? []) : mockLessons;
  const resources = useConvex ? (convexResources ?? []) : mockResources;
  const program = useConvex ? enrolledCtx?.program ?? null : mockProgram;

  const completedLessonIds = useMemo(() => {
    if (useConvex) {
      const set = new Set();
      for (const row of convexProgress ?? []) {
        if (row.completed) set.add(row.lessonId);
      }
      return set;
    }
    const set = new Set();
    for (const lesson of mockLessons) {
      if (MOCK_LEARNER_PROGRESS[lesson._id]?.completed) {
        set.add(lesson._id);
      }
    }
    return set;
  }, [useConvex, convexProgress, mockLessons]);

  const isLessonCompleted = (lessonId) => completedLessonIds.has(lessonId);

  const progress = useMemo(
    () => computeProgress(lessons, isLessonCompleted),
    [lessons, completedLessonIds]
  );

  const isLoading =
    (useConvex &&
      (convexModule === undefined ||
        (convexModule &&
          (convexLessons === undefined ||
            convexResources === undefined ||
            convexExamQuestions === undefined ||
            (needsUserData &&
              (convexProgress === undefined || enrolledCtx === undefined)))))) ||
    (useConvex &&
      Boolean(currentUser?.email) &&
      userLookup === "loading" &&
      convexModule === undefined);

  const notFound = useConvex
    ? convexModule === null
    : Boolean(moduleId) && !mockModule;

  useEffect(() => {
    if (!moduleId || !module || !program) return;

    if (useConvex && convexUser?._id) {
      recordAccess({
        userId: convexUser._id,
        moduleId,
        programId: program._id,
        organizationId: convexUser.organizationId,
      }).catch(() => {});
      return;
    }

    if (useConvex) return;

    const storageId = getRecentStorageUserId(currentUser);
    if (!storageId) return;
    const enrolledPrograms = MOCK_PROGRAM_ENROLLMENTS[storageId] ?? [];
    if (!enrolledPrograms.includes(program._id)) return;

    recordRecentModule({
      userId: storageId,
      moduleId,
      programId: program._id,
      programTitle: program.title,
      moduleTitle: module.title,
    });
  }, [
    moduleId,
    module,
    program,
    useConvex,
    convexUser,
    currentUser,
    recordAccess,
  ]);

  const examQuestions = useConvex
    ? (convexExamQuestions ?? [])
    : (MOCK_EXAM_QUESTIONS[moduleId] ?? []);

  return {
    module,
    lessons,
    resources,
    program,
    progress,
    isLessonCompleted,
    examQuestions,
    isLoading,
    notFound,
    isConvex: useConvex,
    convexUser,
  };
}
