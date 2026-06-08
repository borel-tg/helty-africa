import { adminMutation } from "./lib/functions";

/**
 * Removes pre–training-program certificate rows (moduleId only, no programId).
 * Run once after schema update: npx convex run migrations:removeLegacyCertificates
 */
export const removeLegacyCertificates = adminMutation({
  args: {},
  handler: async (ctx) => {
    const certs = await ctx.db.query("certificates").collect();
    let removed = 0;
    for (const cert of certs) {
      if (!cert.programId) {
        await ctx.db.delete(cert._id);
        removed++;
      }
    }
    return { removed, message: `Deleted ${removed} legacy certificate(s).` };
  },
});
