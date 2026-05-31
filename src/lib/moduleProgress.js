import { MOCK_LESSONS, MOCK_LEARNER_PROGRESS } from "./mockData";

/**
 * Lesson completion stats for a module (mock; swap for Convex lessonProgress later).
 */
export function getModuleLessonProgress(moduleId) {
  const lessons = MOCK_LESSONS[moduleId] || [];
  const progress = MOCK_LEARNER_PROGRESS;
  const completedCount = lessons.filter((l) => progress[l._id]?.completed).length;
  const total = lessons.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const allComplete = total > 0 && completedCount === total;

  let status = "not_started";
  if (allComplete) status = "ready_for_exam";
  else if (completedCount > 0) status = "in_progress";

  return { lessons, completedCount, total, pct, allComplete, status };
}
