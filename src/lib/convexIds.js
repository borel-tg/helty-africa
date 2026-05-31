/** Route ids from Convex (not mock `mod*` / `prog*`). */
export function isConvexModuleId(id) {
  return Boolean(id && !id.startsWith("mod"));
}

export function isConvexProgramId(id) {
  return Boolean(id && !id.startsWith("prog"));
}
