import { MOCK_MODULES } from "../mockData";

/**
 * Maps mock route ids (mod1) to Convex module ids when possible.
 */
export function resolveConvexModuleId(routeModuleId, convexModules) {
  if (!routeModuleId) return null;
  if (!convexModules?.length) return routeModuleId;

  const isMockId = routeModuleId.startsWith("mod");
  if (!isMockId) return routeModuleId;

  const mock = MOCK_MODULES.find((m) => m._id === routeModuleId);
  if (!mock) return convexModules[0]?._id ?? null;

  const byTitle = convexModules.find((m) => m.title === mock.title);
  if (byTitle) return byTitle._id;

  const mockIndex = MOCK_MODULES.findIndex((m) => m._id === routeModuleId);
  const published = [...convexModules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return published[mockIndex]?._id ?? published[0]?._id ?? null;
}
