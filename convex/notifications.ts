import {
  authedMutation,
  authedQuery,
} from "./lib/functions";
import { v } from "convex/values";
import { assertOrgMember } from "./lib/requireAuth";

export const listForRecipient = authedQuery({
  args: {},
  handler: async (ctx) => {
    const user = ctx.user;
    return ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", user._id))
      .order("desc")
      .take(50);
  },
});

/** Notifications with learner and module names for UI display */
export const listEnrichedForRecipient = authedQuery({
  args: {},
  handler: async (ctx) => {
    const user = ctx.user;
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", user._id))
      .order("desc")
      .take(50);

    const enriched = [];
    for (const n of rows) {
      const [learner, mod] = await Promise.all([
        ctx.db.get(n.learnerId),
        ctx.db.get(n.moduleId),
      ]);
      enriched.push({
        ...n,
        learnerName: learner?.name ?? "—",
        moduleName: mod?.title ?? "—",
      });
    }
    return enriched;
  },
});

export const countUnread = authedQuery({
  args: {},
  handler: async (ctx) => {
    const user = ctx.user;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_unread", (q) =>
        q.eq("recipientId", user._id).eq("read", false)
      )
      .collect();
    return unread.length;
  },
});

export const create = authedMutation({
  args: {
    recipientId: v.id("users"),
    organizationId: v.id("organizations"),
    learnerId: v.id("users"),
    moduleId: v.id("modules"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    assertOrgMember(ctx.user, args.organizationId);
    return ctx.db.insert("notifications", {
      ...args,
      type: "exam_passed",
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const markRead = authedMutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const user = ctx.user;
    const notification = await ctx.db.get(notificationId);
    if (!notification || notification.recipientId !== user._id) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(notificationId, { read: true });
  },
});

export const markAllRead = authedMutation({
  args: {},
  handler: async (ctx) => {
    const user = ctx.user;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_unread", (q) =>
        q.eq("recipientId", user._id).eq("read", false)
      )
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});
