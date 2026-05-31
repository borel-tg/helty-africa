import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "./useAuth";
import { useConvexSession } from "./useConvexSession";
import {
  recordRecentModule,
  getRecentStorageUserId,
} from "../lib/recentModules";
import { isConvexModuleId } from "../lib/convexIds";
import { getProgramForModule } from "../lib/moduleProgram";
import { MOCK_MODULES, MOCK_PROGRAM_ENROLLMENTS } from "../lib/mockData";

/**
 * Records module access when the learner opens a module or lesson.
 * Convex: DB row (enrolled programs only). Mock: localStorage (enrolled only).
 */
export function useRecordModuleAccess(moduleId) {
  const { currentUser } = useAuth();
  const { convexUser } = useConvexSession();
  const recordAccess = useMutation(api.recentModules.recordAccess);

  const convexCtx = useQuery(
    api.recentModules.findEnrolledProgramForModule,
    convexUser?._id && moduleId && isConvexModuleId(moduleId)
      ? { userId: convexUser._id, moduleId }
      : "skip"
  );

  const mockModule = MOCK_MODULES.find((m) => m._id === moduleId);
  const mockProgram =
    mockModule && !isConvexModuleId(moduleId)
      ? getProgramForModule(moduleId)
      : null;

  const program = convexCtx?.program ?? mockProgram;
  const module = convexCtx?.module ?? mockModule;

  useEffect(() => {
    if (!moduleId || !program || !module) return;

    if (convexUser?._id && isConvexModuleId(moduleId)) {
      recordAccess({
        userId: convexUser._id,
        moduleId,
        programId: program._id,
        organizationId: convexUser.organizationId,
      }).catch(() => {});
      return;
    }

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
    program,
    module,
    convexUser,
    currentUser,
    recordAccess,
  ]);

  return { program, module };
}
