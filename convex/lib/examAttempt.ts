/** Default module exam duration when settings omit timeLimitMinutes. */
export const DEFAULT_MODULE_EXAM_MINUTES = 30;

/** Default program final exam duration when settings omit timeLimitMinutes. */
export const DEFAULT_GENERAL_EXAM_MINUTES = 45;

/** Grace period after deadline for auto-submit (network / refresh). */
export const EXAM_SUBMIT_GRACE_MS = 60_000;

export function resolveTimeLimitMinutes(
  settingsMinutes: number | undefined | null,
  fallback: number
): number {
  if (settingsMinutes === undefined || settingsMinutes === null) {
    return fallback;
  }
  return settingsMinutes;
}

export function getAttemptDeadlineMs(
  startedAt: number,
  timeLimitMinutes: number
): number | null {
  if (timeLimitMinutes <= 0) return null;
  return startedAt + timeLimitMinutes * 60 * 1000;
}

export function getRemainingSeconds(
  startedAt: number,
  timeLimitMinutes: number,
  now = Date.now()
): number | null {
  const deadline = getAttemptDeadlineMs(startedAt, timeLimitMinutes);
  if (deadline === null) return null;
  return Math.max(0, Math.floor((deadline - now) / 1000));
}

export function isAttemptExpired(
  startedAt: number,
  timeLimitMinutes: number,
  now = Date.now()
): boolean {
  const deadline = getAttemptDeadlineMs(startedAt, timeLimitMinutes);
  if (deadline === null) return false;
  return now >= deadline;
}

export function isSubmitPastGrace(
  startedAt: number,
  timeLimitMinutes: number,
  now = Date.now()
): boolean {
  const deadline = getAttemptDeadlineMs(startedAt, timeLimitMinutes);
  if (deadline === null) return false;
  return now > deadline + EXAM_SUBMIT_GRACE_MS;
}

export function assertAttemptOpenForEdit(
  startedAt: number,
  timeLimitMinutes: number | undefined,
  submittedAt: number | undefined
): void {
  if (submittedAt != null) {
    throw new Error("Attempt already submitted");
  }
  const limit = timeLimitMinutes ?? 0;
  if (limit > 0 && isAttemptExpired(startedAt, limit)) {
    throw new Error("Exam time has expired");
  }
}

export function assertSubmitAllowed(
  startedAt: number,
  timeLimitMinutes: number | undefined,
  submittedAt: number | undefined
): void {
  if (submittedAt != null) {
    throw new Error("Attempt already submitted");
  }
  const limit = timeLimitMinutes ?? 0;
  if (limit > 0 && isSubmitPastGrace(startedAt, limit)) {
    throw new Error("Exam time has expired");
  }
}
