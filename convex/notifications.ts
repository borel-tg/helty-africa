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
