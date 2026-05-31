const STORAGE_KEY = "helty_recent_modules";
const MAX_ENTRIES = 10;

/**
 * @typedef {{ moduleId: string; programId: string; programTitle: string; moduleTitle: string; accessedAt: number }} RecentModuleEntry
 */

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/**
 * Stable key for localStorage (mock session id).
 */
export function getRecentStorageUserId(currentUser) {
  return currentUser?._id ?? null;
}

/**
 * Record that the learner opened a module (mock / offline fallback).
 */
export function recordRecentModule({
  userId,
  moduleId,
  programId,
  programTitle,
  moduleTitle,
}) {
  if (!userId || !moduleId || !programId) return;

  const all = readAll();
  const byUser = all.filter((e) => e.userId !== userId);
  const forUser = all.filter((e) => e.userId === userId && e.moduleId !== moduleId);

  const entry = {
    userId,
    moduleId,
    programId,
    programTitle: programTitle ?? "",
    moduleTitle: moduleTitle ?? "",
    accessedAt: Date.now(),
  };

  const updated = [entry, ...forUser]
    .sort((a, b) => b.accessedAt - a.accessedAt)
    .slice(0, MAX_ENTRIES);

  writeAll([...byUser, ...updated]);
}

/**
 * @param {string} userId
 * @param {number} [limit=10]
 * @returns {RecentModuleEntry[]}
 */
export function getRecentModules(userId, limit = 10) {
  if (!userId) return [];
  return readAll()
    .filter((e) => e.userId === userId)
    .sort((a, b) => b.accessedAt - a.accessedAt)
    .slice(0, limit);
}

/**
 * Keep only modules in programs the learner is enrolled in; refresh titles from catalog.
 * @param {RecentModuleEntry[]} entries
 * @param {Array<{ _id: string; title: string; enrolled?: boolean; moduleIds?: string[] }>} enrolledPrograms
 * @param {Array<{ _id: string; title: string }>} [modulesCatalog]
 * @param {number} [limit=3]
 */
export function filterRecentByEnrolled(
  entries,
  enrolledPrograms,
  modulesCatalog = [],
  limit = 3
) {
  const enrolled = enrolledPrograms.filter((p) => p.enrolled);
  const enrolledProgramIds = new Set(enrolled.map((p) => p._id));

  const moduleMeta = new Map();
  for (const program of enrolled) {
    for (const modId of program.moduleIds ?? []) {
      const mod = modulesCatalog.find((m) => m._id === modId);
      moduleMeta.set(modId, {
        programId: program._id,
        programTitle: program.title,
        moduleTitle: mod?.title,
      });
    }
  }

  return entries
    .filter((e) => enrolledProgramIds.has(e.programId))
    .filter((e) => moduleMeta.has(e.moduleId))
    .map((e) => {
      const meta = moduleMeta.get(e.moduleId);
      return {
        ...e,
        programId: meta.programId,
        programTitle: meta.programTitle,
        moduleTitle: meta.moduleTitle ?? e.moduleTitle,
      };
    })
    .sort((a, b) => b.accessedAt - a.accessedAt)
    .slice(0, limit);
}
