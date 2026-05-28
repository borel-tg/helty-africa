import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Returns a short-lived URL for uploading a file to Convex storage. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/** Resolves a storage ID to a public URL for display/download. */
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
