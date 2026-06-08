import {
  customCtx,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { mutation, query } from "../_generated/server";
import {
  requireAdmin,
  requireAuthUser,
  requireLeadOrAdmin,
} from "./requireAuth";

export const authedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await requireAuthUser(ctx);
    return { user };
  })
);

export const authedMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await requireAuthUser(ctx);
    return { user };
  })
);

export const adminQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await requireAdmin(ctx);
    return { user };
  })
);

export const adminMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await requireAdmin(ctx);
    return { user };
  })
);

export const leadOrAdminQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await requireLeadOrAdmin(ctx);
    return { user };
  })
);

export const leadOrAdminMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await requireLeadOrAdmin(ctx);
    return { user };
  })
);

/** Public Convex functions (no session required). */
export { mutation as publicMutation, query as publicQuery };
