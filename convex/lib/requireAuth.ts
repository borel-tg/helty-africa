import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

export type SafeUser = Omit<Doc<"users">, "passwordHash"> & {
  passwordHash?: never;
};

function stripPasswordHash(user: Doc<"users">): SafeUser {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export async function getUserIdFromIdentity(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users"> | null> {
  const userId = await getAuthUserId(ctx);
  return userId as Id<"users"> | null;
}

export async function getAuthUser(
  ctx: QueryCtx | MutationCtx
): Promise<SafeUser | null> {
  const userId = await getUserIdFromIdentity(ctx);
  if (!userId) return null;
  const user = await ctx.db.get(userId);
  if (!user || user.status !== "active") return null;
  return stripPasswordHash(user);
}

export async function requireAuthUser(ctx: QueryCtx | MutationCtx): Promise<SafeUser> {
  const user = await getAuthUser(ctx);
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<SafeUser> {
  const user = await requireAuthUser(ctx);
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Admin access required");
  }
  return user;
}

export async function requireLeadOrAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<SafeUser> {
  const user = await requireAuthUser(ctx);
  if (
    user.role !== "lead" &&
    user.role !== "admin" &&
    user.role !== "super_admin"
  ) {
    throw new Error("Lead or admin access required");
  }
  return user;
}

export function assertOrgMember(
  user: SafeUser,
  organizationId: Id<"organizations">
): void {
  if (user.organizationId !== organizationId) {
    throw new Error("Unauthorized");
  }
}

export function assertOrgAdmin(
  user: SafeUser,
  organizationId: Id<"organizations">
): void {
  assertOrgMember(user, organizationId);
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Admin access required");
  }
}

export function assertAdmin(user: SafeUser): void {
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Admin access required");
  }
}

/** @deprecated Prefer authed wrappers + assertOrgMember(user, orgId) */
export async function requireOrgMember(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">
): Promise<SafeUser> {
  const user = await requireAuthUser(ctx);
  assertOrgMember(user, organizationId);
  return user;
}

/** @deprecated Prefer adminMutation + assertOrgMember(user, orgId) */
export async function requireOrgAdmin(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">
): Promise<SafeUser> {
  const user = await requireAuthUser(ctx);
  assertOrgAdmin(user, organizationId);
  return user;
}

/** Admin acting on another user in the same organization. */
export async function loadOrgUserAccess(
  ctx: QueryCtx | MutationCtx,
  actor: SafeUser,
  targetUserId: Id<"users">
): Promise<{ actor: SafeUser; target: Doc<"users"> }> {
  assertAdmin(actor);
  const target = await ctx.db.get(targetUserId);
  if (!target || target.organizationId !== actor.organizationId) {
    throw new Error("User not found");
  }
  return { actor, target };
}

/** @deprecated Use loadOrgUserAccess(ctx, ctx.user, targetUserId) */
export async function requireOrgUserAccess(
  ctx: QueryCtx | MutationCtx,
  targetUserId: Id<"users">
): Promise<{ actor: SafeUser; target: Doc<"users"> }> {
  const actor = await requireAdmin(ctx);
  return loadOrgUserAccess(ctx, actor, targetUserId);
}
