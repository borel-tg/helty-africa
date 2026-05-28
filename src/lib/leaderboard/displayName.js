/**
 * Privacy-friendly display name for leaderboard rows.
 * "Fatima Coulibaly" → "Fatima C."
 */
export function formatLearnerDisplayName(fullName) {
  if (!fullName || typeof fullName !== "string") return "—";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}
