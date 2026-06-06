import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

async function requireOrgAdmin(
  ctx: MutationCtx,
  userId: Id<"users">,
  organizationId: Id<"organizations">
) {
  const user = await ctx.db.get(userId);
  if (!user || user.organizationId !== organizationId) {
    throw new Error("Unauthorized");
  }
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Admin access required");
  }
}

export const get = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    return ctx.db.get(organizationId);
  },
});

export const updateName = mutation({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.userId, args.organizationId);

    const name = args.name.trim();
    if (!name) {
      throw new Error("Le nom de l'organisation est obligatoire.");
    }

    await ctx.db.patch(args.organizationId, { name });
    return args.organizationId;
  },
});
