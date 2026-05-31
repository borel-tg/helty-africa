/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as certificates from "../certificates.js";
import type * as exams from "../exams.js";
import type * as generalExams from "../generalExams.js";
import type * as invitations from "../invitations.js";
import type * as leaderboard from "../leaderboard.js";
import type * as lessons from "../lessons.js";
import type * as lib_evaluation from "../lib/evaluation.js";
import type * as migrations from "../migrations.js";
import type * as moduleResources from "../moduleResources.js";
import type * as modules from "../modules.js";
import type * as notifications from "../notifications.js";
import type * as progress from "../progress.js";
import type * as recentModules from "../recentModules.js";
import type * as seed from "../seed.js";
import type * as storage from "../storage.js";
import type * as trainingPrograms from "../trainingPrograms.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  certificates: typeof certificates;
  exams: typeof exams;
  generalExams: typeof generalExams;
  invitations: typeof invitations;
  leaderboard: typeof leaderboard;
  lessons: typeof lessons;
  "lib/evaluation": typeof lib_evaluation;
  migrations: typeof migrations;
  moduleResources: typeof moduleResources;
  modules: typeof modules;
  notifications: typeof notifications;
  progress: typeof progress;
  recentModules: typeof recentModules;
  seed: typeof seed;
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
