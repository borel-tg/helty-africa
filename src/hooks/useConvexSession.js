import { useEffect, useState } from "react";
import { useConvex, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "./useAuth";
import { resolveConvexModuleId } from "../lib/certificate/resolveModuleId";

function isConvexDeploymentError(err) {
  const msg = String(err?.message ?? err);
  return /Could not find public function/i.test(msg);
}

/**
 * Resolves the logged-in mock user to a Convex user (by email) and org modules.
 */
export function useConvexSession() {
  const convex = useConvex();
  const { currentUser } = useAuth();
  const email = currentUser?.email?.trim().toLowerCase();

  const [convexUser, setConvexUser] = useState(null);
  const [userLookup, setUserLookup] = useState("idle"); // idle | loading | ok
  const [convexSyncError, setConvexSyncError] = useState(false);

  useEffect(() => {
    if (!email) {
      setConvexUser(null);
      setUserLookup("idle");
      setConvexSyncError(false);
      return;
    }

    let cancelled = false;
    const lookupEmail = email;
    setUserLookup("loading");
    setConvexSyncError(false);

    convex
      .query(api.users.getByEmail, { email: lookupEmail })
      .then((user) => {
        if (cancelled) return;
        setConvexUser(user ?? null);
        setUserLookup("ok");
        setConvexSyncError(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setConvexUser(null);
        setUserLookup("ok");
        setConvexSyncError(isConvexDeploymentError(err));
      });

    return () => {
      cancelled = true;
    };
  }, [email, convex]);

  const publishedModules = useQuery(
    api.modules.listPublished,
    convexUser?.organizationId
      ? { organizationId: convexUser.organizationId }
      : "skip"
  );

  const template = useQuery(
    api.certificates.getTemplate,
    convexUser?.organizationId
      ? { organizationId: convexUser.organizationId }
      : "skip"
  );

  const isLoading =
    userLookup === "loading" ||
    (convexUser?.organizationId &&
      (publishedModules === undefined || template === undefined));

  const convexUserMissing =
    Boolean(email) && userLookup === "ok" && !convexUser && !convexSyncError;

  return {
    convexUser,
    publishedModules: publishedModules ?? [],
    template: template ?? null,
    isLoading: Boolean(isLoading),
    convexSyncError,
    convexUserMissing,
    resolveModuleId: (routeModuleId) =>
      resolveConvexModuleId(routeModuleId, publishedModules),
  };
}
