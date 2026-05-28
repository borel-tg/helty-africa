import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const LOCALE = "fr-FR";

export function formatDate(timestamp) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(timestamp) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTimeAgo(timestamp, t) {
  if (!timestamp) return "—";
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t ? t("common.justNow") : "à l'instant";
  if (mins < 60) return t ? t("common.minutesAgo", { count: mins }) : `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t ? t("common.hoursAgo", { count: hours }) : `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return t ? t("common.daysAgo", { count: days }) : `il y a ${days} j`;
}

export function formatDuration(seconds) {
  if (!seconds) return "0m";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

export function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  return match ? match[1] : null;
}

export function getModuleStatus(lessons, progress, attempts, passingScore) {
  if (!lessons || lessons.length === 0) return "not_started";

  const completedLessons = lessons.filter((l) =>
    progress?.some((p) => p.lessonId === l._id && p.completed)
  );
  const allLessonsComplete = completedLessons.length === lessons.length;

  const passedAttempt = attempts?.find((a) => a.passed);
  if (passedAttempt) return "completed";

  const exhaustedAttempts =
    attempts?.length > 0 && attempts.every((a) => !a.passed);

  if (allLessonsComplete && attempts?.length === 0) return "ready_for_exam";
  if (allLessonsComplete && !passedAttempt && exhaustedAttempts)
    return "failed";
  if (completedLessons.length > 0) return "in_progress";
  return "not_started";
}

export const STATUS_COLORS = {
  not_started: { bg: "bg-gray-100", text: "text-gray-600" },
  in_progress: { bg: "bg-blue-100", text: "text-blue-700" },
  ready_for_exam: { bg: "bg-orange-100", text: "text-orange-700" },
  completed: { bg: "bg-green-100", text: "text-green-700" },
  failed: { bg: "bg-red-100", text: "text-red-700" },
};
