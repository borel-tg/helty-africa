import { MOCK_TRAINING_PROGRAM, MOCK_MODULES } from "./mockData";

/**
 * Resolve which training program owns a module (mock: one program per module).
 */
export function getProgramForModule(moduleId) {
  const mod = MOCK_MODULES.find((m) => m._id === moduleId);
  if (!mod) return null;

  if (MOCK_TRAINING_PROGRAM.moduleIds?.includes(moduleId)) {
    return MOCK_TRAINING_PROGRAM;
  }

  return null;
}
