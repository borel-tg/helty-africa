import {
  adminMutation,
  authedQuery,
} from "./lib/functions";
import { v } from "convex/values";
import { assertOrgAdmin } from "./lib/requireAuth";

export const listByModule = authedQuery({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, { moduleId }) => {
    const user = ctx.user;
    const mod = await ctx.db.get(moduleId);
    if (!mod || mod.organizationId !== user.organizationId) {
      throw new Error("Unauthorized");
    }
    return ctx.db
      .query("moduleResources")
      .withIndex("by_module_order", (q) => q.eq("moduleId", moduleId))
      .collect();
  },
});

export const create = adminMutation({
  args: {
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("link"),
      v.literal("video"),
      v.literal("pdf"),
      v.literal("ppt"),
      v.literal("image")
    ),
    url: v.string(),
    fileName: v.optional(v.string()),
    downloadable: v.boolean(),
  },
  handler: async (ctx, args) => {
    assertOrgAdmin(ctx.user, args.organizationId);
    const mod = await ctx.db.get(args.moduleId);
    if (!mod || mod.organizationId !== args.organizationId) {
      throw new Error("Module not found");
    }
    const existing = await ctx.db
      .query("moduleResources")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .collect();
    const now = Date.now();
    return ctx.db.insert("moduleResources", {
      ...args,
      order: existing.length,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = adminMutation({
  args: {
    resourceId: v.id("moduleResources"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("link"),
        v.literal("video"),
        v.literal("pdf"),
        v.literal("ppt"),
        v.literal("image")
      )
    ),
    url: v.optional(v.string()),
    fileName: v.optional(v.string()),
    downloadable: v.optional(v.boolean()),
  },
  handler: async (ctx, { resourceId, ...updates }) => {
    const resource = await ctx.db.get(resourceId);
    if (!resource) throw new Error("Resource not found");
    assertOrgAdmin(ctx.user, resource.organizationId);
    await ctx.db.patch(resourceId, { ...updates, updatedAt: Date.now() });
  },
});

export const remove = adminMutation({
  args: { resourceId: v.id("moduleResources") },
  handler: async (ctx, { resourceId }) => {
    const resource = await ctx.db.get(resourceId);
    if (!resource) throw new Error("Resource not found");
    assertOrgAdmin(ctx.user, resource.organizationId);
    await ctx.db.delete(resourceId);
  },
});
