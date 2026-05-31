import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "./useAuth";

/**
 * Org-scoped Convex data for the logged-in user (modules, certificate template).
 */
export function useConvexSession() {
  const { currentUser } = useAuth();

  const publishedModules = useQuery(
    api.modules.listPublished,
    currentUser?.organizationId
      ? { organizationId: currentUser.organizationId }
      : "skip"
  );

  const template = useQuery(
    api.certificates.getTemplate,
    currentUser?.organizationId
      ? { organizationId: currentUser.organizationId }
      : "skip"
  );

  const isLoading =
    Boolean(currentUser?.organizationId) &&
    (publishedModules === undefined || template === undefined);

  return {
    convexUser: currentUser,
    publishedModules: publishedModules ?? [],
    template: template ?? null,
    isLoading: Boolean(isLoading),
  };
}
