import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "./useAuth";
import { useConvexSession } from "./useConvexSession";

/** Record module access when a learner opens a module page. */
export function useRecordModuleAccess(moduleId) {
  const { currentUser } = useAuth();
  const { convexUser } = useConvexSession();
  const recordAccess = useMutation(api.recentModules.recordAccess);

  const convexCtx = useQuery(
    api.recentModules.findEnrolledProgramForModule,
    convexUser?._id && moduleId
      ? { userId: convexUser._id, moduleId }
      : "skip"
  );

  const program = convexCtx?.program ?? null;
  const module = convexCtx?.module ?? null;

  useEffect(() => {
    if (!moduleId || !program || !convexUser?._id) return;

    recordAccess({
      userId: convexUser._id,
      moduleId,
      programId: program._id,
      organizationId: convexUser.organizationId,
    }).catch(() => {});
  }, [moduleId, program, convexUser, recordAccess]);

  return { program, module, currentUser };
}
