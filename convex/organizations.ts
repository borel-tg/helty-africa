import {
  adminMutation,
  authedQuery,
} from "./lib/functions";
import { v } from "convex/values";
import { assertOrgAdmin, assertOrgMember } from "./lib/requireAuth";

export const get = authedQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    assertOrgMember(ctx.user, organizationId);
    return ctx.db.get(organizationId);
  },
});

export const updateName = adminMutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    assertOrgAdmin(ctx.user, args.organizationId);

    const name = args.name.trim();
    if (!name) {
      throw new Error("Le nom de l'organisation est obligatoire.");
    }

    await ctx.db.patch(args.organizationId, { name });
    return args.organizationId;
  },
});
