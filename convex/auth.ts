import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { MutationCtx } from "./_generated/server";
import type { DataModel } from "./_generated/dataModel";
import { hashPassword, verifyPassword } from "./lib/password";

const passwordProvider = Password<DataModel>({
  crypto: {
    async hashSecret(password: string) {
      return await hashPassword(password);
    },
    async verifySecret(password: string, secret: string) {
      return await verifyPassword(password, secret);
    },
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [passwordProvider],
  callbacks: {
    async createOrUpdateUser(ctx: MutationCtx, args) {
      if (args.existingUserId) {
        return args.existingUserId;
      }

      const email =
        typeof args.profile.email === "string"
          ? args.profile.email.trim().toLowerCase()
          : null;

      if (email) {
        const existing = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", email))
          .first();
        if (existing) {
          return existing._id;
        }
      }

      throw new Error("Compte introuvable.");
    },
    async afterUserCreatedOrUpdated(ctx, { userId }) {
      await ctx.db.patch(userId, { lastLoginAt: Date.now() });
    },
  },
});
