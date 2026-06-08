import { internalMutation } from "./_generated/server";
import { adminMutation } from "./lib/functions";
import { ensurePasswordAccount } from "./lib/passwordAccount";

/** One-time: link existing users' passwordHash to Convex Auth accounts (dev seed). */
export const migratePasswordAccounts = adminMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let linked = 0;

    for (const user of users) {
      if (!user.email || !user.passwordHash) continue;
      await ensurePasswordAccount(
        ctx,
        user._id,
        user.email,
        user.passwordHash
      );
      linked++;
    }

    return { linked };
  },
});

export const migratePasswordAccountsInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let linked = 0;

    for (const user of users) {
      if (!user.email || !user.passwordHash) continue;
      await ensurePasswordAccount(
        ctx,
        user._id,
        user.email,
        user.passwordHash
      );
      linked++;
    }

    return { linked };
  },
});
