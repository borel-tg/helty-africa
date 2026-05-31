import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listForRecipient = query({
  args: { recipientId: v.id("users") },
  handler: async (ctx, { recipientId }) => {
    return ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", recipientId))
      .order("desc")
      .take(50);
  },
});

/** Notifications with learner and module names for UI display */
export const listEnrichedForRecipient = query({
  args: { recipientId: v.id("users") },
  handler: async (ctx, { recipientId }) => {
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", recipientId))
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

export const countUnread = query({
  args: { recipientId: v.id("users") },
  handler: async (ctx, { recipientId }) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_unread", (q) =>
        q.eq("recipientId", recipientId).eq("read", false)
      )
      .collect();
    return unread.length;
  },
});

export const create = mutation({
  args: {
    recipientId: v.id("users"),
    organizationId: v.id("organizations"),
    learnerId: v.id("users"),
    moduleId: v.id("modules"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("notifications", {
      ...args,
      type: "exam_passed",
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    await ctx.db.patch(notificationId, { read: true });
  },
});

export const markAllRead = mutation({
  args: { recipientId: v.id("users") },
  handler: async (ctx, { recipientId }) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_unread", (q) =>
        q.eq("recipientId", recipientId).eq("read", false)
      )
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});
