import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { hashPassword } from "./password";

const PASSWORD_PROVIDER = "password";

export async function findPasswordAccount(
  ctx: MutationCtx,
  email: string
) {
  const normalized = email.trim().toLowerCase();
  return ctx.db
    .query("authAccounts")
    .withIndex("providerAndAccountId", (q) =>
      q.eq("provider", PASSWORD_PROVIDER).eq("providerAccountId", normalized)
    )
    .unique();
}

/** Sync Convex Auth password account after password changes or user creation. */
export async function ensurePasswordAccount(
  ctx: MutationCtx,
  userId: Id<"users">,
  email: string,
  passwordHash: string
) {
  const normalized = email.trim().toLowerCase();
  const existing = await findPasswordAccount(ctx, normalized);

  if (existing) {
    if (existing.userId !== userId) {
      throw new Error("Email already linked to another account");
    }
    if (existing.secret !== passwordHash) {
      await ctx.db.patch(existing._id, { secret: passwordHash });
    }
    return existing._id;
  }

  return ctx.db.insert("authAccounts", {
    userId,
    provider: PASSWORD_PROVIDER,
    providerAccountId: normalized,
    secret: passwordHash,
  });
}

export async function ensurePasswordAccountFromPlainPassword(
  ctx: MutationCtx,
  userId: Id<"users">,
  email: string,
  password: string
) {
  const passwordHash = await hashPassword(password);
  await ctx.db.patch(userId, { passwordHash });
  return ensurePasswordAccount(ctx, userId, email, passwordHash);
}
