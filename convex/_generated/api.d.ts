/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authMigration from "../authMigration.js";
import type * as certificates from "../certificates.js";
import type * as emails from "../emails.js";
import type * as exams from "../exams.js";
import type * as generalExams from "../generalExams.js";
import type * as http from "../http.js";
import type * as invitations from "../invitations.js";
import type * as leaderboard from "../leaderboard.js";
import type * as lessons from "../lessons.js";
import type * as lib_brand from "../lib/brand.js";
import type * as lib_certificateTemplate from "../lib/certificateTemplate.js";
import type * as lib_evaluation from "../lib/evaluation.js";
import type * as lib_examAttempt from "../lib/examAttempt.js";
import type * as lib_functions from "../lib/functions.js";
import type * as lib_learnerCategories from "../lib/learnerCategories.js";
import type * as lib_password from "../lib/password.js";
import type * as lib_passwordAccount from "../lib/passwordAccount.js";
import type * as lib_programStatsHelpers from "../lib/programStatsHelpers.js";
import type * as lib_requireAuth from "../lib/requireAuth.js";
import type * as lib_siteUrl from "../lib/siteUrl.js";
import type * as migrations from "../migrations.js";
import type * as moduleResources from "../moduleResources.js";
import type * as modules from "../modules.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as passwordReset from "../passwordReset.js";
import type * as progress from "../progress.js";
import type * as recentModules from "../recentModules.js";
import type * as seed from "../seed.js";
import type * as stats from "../stats.js";
import type * as storage from "../storage.js";
import type * as trainingPrograms from "../trainingPrograms.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authMigration: typeof authMigration;
  certificates: typeof certificates;
  emails: typeof emails;
  exams: typeof exams;
  generalExams: typeof generalExams;
  http: typeof http;
  invitations: typeof invitations;
  leaderboard: typeof leaderboard;
  lessons: typeof lessons;
  "lib/brand": typeof lib_brand;
  "lib/certificateTemplate": typeof lib_certificateTemplate;
  "lib/evaluation": typeof lib_evaluation;
  "lib/examAttempt": typeof lib_examAttempt;
  "lib/functions": typeof lib_functions;
  "lib/learnerCategories": typeof lib_learnerCategories;
  "lib/password": typeof lib_password;
  "lib/passwordAccount": typeof lib_passwordAccount;
  "lib/programStatsHelpers": typeof lib_programStatsHelpers;
  "lib/requireAuth": typeof lib_requireAuth;
  "lib/siteUrl": typeof lib_siteUrl;
  migrations: typeof migrations;
  moduleResources: typeof moduleResources;
  modules: typeof modules;
  notifications: typeof notifications;
  organizations: typeof organizations;
  passwordReset: typeof passwordReset;
  progress: typeof progress;
  recentModules: typeof recentModules;
  seed: typeof seed;
  stats: typeof stats;
  storage: typeof storage;
  trainingPrograms: typeof trainingPrograms;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
