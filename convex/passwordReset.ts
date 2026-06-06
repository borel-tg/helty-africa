import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { hashPassword } from "./lib/password";

const RESET_TTL_MS = 60 * 60 * 1000;

export const requestReset = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return { ok: true as const };

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();

    if (!user || user.status !== "active" || !user.email) {
      return { ok: true as const };
    }

    const pending = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const row of pending) {
      if (!row.usedAt) await ctx.db.delete(row._id);
    }

    const token =
      Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = Date.now() + RESET_TTL_MS;

    await ctx.db.insert("passwordResetTokens", {
      userId: user._id,
      email: normalized,
      token,
      expiresAt,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.emails.sendPasswordResetEmail, {
      to: normalized,
      token,
      name: user.name,
    });

    return { ok: true as const };
  },
});

/** Reset page — safe preview (no token secret beyond validity). */
export const getPublicByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const row = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!row) return { status: "not_found" as const };
    if (row.usedAt) return { status: "used" as const };
    if (row.expiresAt < Date.now()) return { status: "expired" as const };

    return { status: "valid" as const, email: row.email };
  },
});

export const completeReset = mutation({
  args: {
    token: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { token, password }) => {
    if (password.length < 8) {
      throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
    }

    const row = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!row) throw new Error("Lien de réinitialisation invalide.");
    if (row.usedAt) throw new Error("Ce lien a déjà été utilisé.");
    if (row.expiresAt < Date.now()) {
      throw new Error("Ce lien a expiré. Demandez un nouveau lien.");
    }

    const user = await ctx.db.get(row.userId);
    if (!user || user.status !== "active") {
      throw new Error("Compte introuvable ou inactif.");
    }

    const passwordHash = await hashPassword(password);
    const now = Date.now();

    await ctx.db.patch(user._id, {
      passwordHash,
      mustChangePassword: false,
    });
    await ctx.db.patch(row._id, { usedAt: now });

    return { success: true as const, email: row.email };
  },
});
