import {
  authedMutation,
  authedQuery,
} from "./lib/functions";
import { v } from "convex/values";

export const generateUploadUrl = authedMutation({
  args: {},
  handler: async (ctx) => {
    if (
      ctx.user.role !== "admin" &&
      ctx.user.role !== "super_admin" &&
      ctx.user.role !== "lead"
    ) {
      throw new Error("Unauthorized");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = authedQuery({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
