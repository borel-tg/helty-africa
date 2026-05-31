import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { verifyPassword } from "./lib/password";

function stripSensitive(user: {
  passwordHash?: string;
  [key: string]: unknown;
}) {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    const normalized = email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();

    if (!user || user.status !== "active") {
      return { success: false as const };
    }
    if (!user.passwordHash) {
      return { success: false as const };
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return { success: false as const };
    }

    const now = Date.now();
    await ctx.db.patch(user._id, { lastLoginAt: now });

    return {
      success: true as const,
      user: stripSensitive({ ...user, lastLoginAt: now }),
    };
  },
});

export const getSession = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user || user.status !== "active") return null;
    return stripSensitive(user);
  },
});
