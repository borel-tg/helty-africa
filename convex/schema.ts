import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { learnerCategoryKeyValidator } from "./lib/learnerCategories";

const { users: _authUsersTable, ...authSupportTables } = authTables;

/** Per training program — fully configurable evaluation rules. */
export const evaluationPolicyValidator = v.object({
  programPassThreshold: v.number(),
  moduleExamWeight: v.number(),
  generalExamWeight: v.number(),
  generalExamEnabled: v.boolean(),
  generalExamMaxRetakes: v.union(v.number(), v.literal("unlimited")),
  unlockGeneralExamMode: v.union(
    v.literal("all_module_attempts"),
    v.literal("all_module_passes")
  ),
});

export default defineSchema({
  ...authSupportTables,

  // ── Organizations ──────────────────────────────────────────────
  organizations: defineTable({
    name: v.string(),
    slug: v.string(), // url-safe identifier
    logoUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  // ── Users (Convex Auth + app fields) ───────────────────────────
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    organizationId: v.id("organizations"),
    role: v.union(
      v.literal("super_admin"),
      v.literal("admin"),
      v.literal("lead"),
      v.literal("learner")
    ),
    status: v.union(v.literal("active"), v.literal("inactive")),
    leadId: v.optional(v.id("users")),
    learnerCategoryKey: v.optional(learnerCategoryKeyValidator),
    passwordHash: v.optional(v.string()),
    mustChangePassword: v.optional(v.boolean()),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_org", ["organizationId"])
    .index("by_lead", ["leadId"])
    .index("by_org_category", ["organizationId", "learnerCategoryKey"]),

  // ── Invitations ────────────────────────────────────────────────
  invitations: defineTable({
    organizationId: v.id("organizations"),
    email: v.string(),
    token: v.string(), // unique magic-link token
    role: v.union(v.literal("admin"), v.literal("lead"), v.literal("learner")),
    invitedBy: v.id("users"),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"]),

  // ── Password reset ─────────────────────────────────────────────
  passwordResetTokens: defineTable({
    userId: v.id("users"),
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  // ── Training programs ─────────────────────────────────────────
  trainingPrograms: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")),
    /** open = learners can self-enroll; closed = admin assigns only */
    accessMode: v.union(v.literal("open"), v.literal("closed")),
    evaluationPolicy: evaluationPolicyValidator,
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_org_status", ["organizationId", "status"]),

  trainingProgramModules: defineTable({
    programId: v.id("trainingPrograms"),
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    order: v.number(),
  })
    .index("by_program", ["programId"])
    .index("by_program_order", ["programId", "order"])
    .index("by_module", ["moduleId"]),

  programEnrollments: defineTable({
    userId: v.id("users"),
    programId: v.id("trainingPrograms"),
    organizationId: v.id("organizations"),
    enrolledAt: v.number(),
    completedAt: v.optional(v.number()),
    finalScore: v.optional(v.number()),
    passed: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_program", ["programId"])
    .index("by_user_program", ["userId", "programId"]),

  /** Last time a learner opened a module (enrolled programs only). */
  learnerModuleAccess: defineTable({
    userId: v.id("users"),
    moduleId: v.id("modules"),
    programId: v.id("trainingPrograms"),
    organizationId: v.id("organizations"),
    lastAccessedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_module", ["userId", "moduleId"]),

  generalExamQuestions: defineTable({
    programId: v.id("trainingPrograms"),
    organizationId: v.id("organizations"),
    questionText: v.string(),
    imageUrl: v.optional(v.string()),
    options: v.array(v.object({ id: v.string(), text: v.string() })),
    correctOptionId: v.string(),
    /** Copied from a module question for traceability */
    sourceModuleQuestionId: v.optional(v.id("examQuestions")),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_program", ["programId"])
    .index("by_program_order", ["programId", "order"]),

  generalExamSettings: defineTable({
    programId: v.id("trainingPrograms"),
    organizationId: v.id("organizations"),
    timeLimitMinutes: v.optional(v.number()),
    showCorrectAnswers: v.boolean(),
    allowReview: v.boolean(),
    randomizeQuestions: v.boolean(),
  }).index("by_program", ["programId"]),

  generalExamAttempts: defineTable({
    userId: v.id("users"),
    programId: v.id("trainingPrograms"),
    organizationId: v.id("organizations"),
    attemptNumber: v.number(),
    answers: v.array(
      v.object({
        questionId: v.id("generalExamQuestions"),
        selectedOptionId: v.string(),
      })
    ),
    score: v.optional(v.number()),
    startedAt: v.number(),
    submittedAt: v.optional(v.number()),
    /** Snapshot at start — 0 = unlimited */
    timeLimitMinutes: v.optional(v.number()),
    /** Question order for resume (especially when randomized) */
    questionOrder: v.optional(v.array(v.id("generalExamQuestions"))),
    savedAnswers: v.optional(
      v.array(
        v.object({
          questionId: v.id("generalExamQuestions"),
          selectedOptionId: v.string(),
        })
      )
    ),
  })
    .index("by_user_program", ["userId", "programId"])
    .index("by_program", ["programId"]),

  // ── Modules ────────────────────────────────────────────────────
  modules: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.string(),
    thumbnailUrl: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    order: v.number(),
    passingScore: v.number(), // 0-100, default 70
    maxRetakes: v.union(v.number(), v.literal("unlimited")), // default 3
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_org_order", ["organizationId", "order"]),

  // ── Lessons ────────────────────────────────────────────────────
  lessons: defineTable({
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("text"), v.literal("video"), v.literal("document")),
    order: v.number(),
    // Text lesson
    content: v.optional(v.string()), // HTML content
    // Video lesson
    videoUrl: v.optional(v.string()), // YouTube URL
    videoId: v.optional(v.string()), // extracted YouTube ID
    // Document lesson
    fileUrl: v.optional(v.string()), // Convex storage URL
    fileType: v.optional(
      v.union(v.literal("pdf"), v.literal("ppt"), v.literal("doc"))
    ),
    fileName: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_module", ["moduleId"])
    .index("by_module_order", ["moduleId", "order"]),

  // ── Module Resources ────────────────────────────────────────────
  moduleResources: defineTable({
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
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_module", ["moduleId"])
    .index("by_module_order", ["moduleId", "order"]),

  // ── Exam Questions ─────────────────────────────────────────────
  examQuestions: defineTable({
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    questionText: v.string(),
    imageUrl: v.optional(v.string()),
    options: v.array(
      v.object({ id: v.string(), text: v.string() })
    ),
    correctOptionId: v.string(),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_module", ["moduleId"])
    .index("by_module_order", ["moduleId", "order"]),

  // ── Exam Settings (per module) ─────────────────────────────────
  examSettings: defineTable({
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    timeLimitMinutes: v.optional(v.number()), // 0 = unlimited
    showCorrectAnswers: v.boolean(),
    allowReview: v.boolean(),
    randomizeQuestions: v.boolean(),
  }).index("by_module", ["moduleId"]),

  // ── Exam Attempts ──────────────────────────────────────────────
  examAttempts: defineTable({
    userId: v.id("users"),
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    attemptNumber: v.number(),
    answers: v.array(
      v.object({ questionId: v.id("examQuestions"), selectedOptionId: v.string() })
    ),
    score: v.optional(v.number()), // percentage 0-100
    passed: v.optional(v.boolean()),
    startedAt: v.number(),
    submittedAt: v.optional(v.number()),
    /** Snapshot at start — 0 = unlimited */
    timeLimitMinutes: v.optional(v.number()),
    // For resuming in-progress exams
    savedAnswers: v.optional(
      v.array(v.object({ questionId: v.id("examQuestions"), selectedOptionId: v.string() }))
    ),
  })
    .index("by_user_module", ["userId", "moduleId"])
    .index("by_module", ["moduleId"]),

  // ── Lesson Progress ────────────────────────────────────────────
  lessonProgress: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    completed: v.boolean(),
    /** Set once when the learner marks the lesson complete (used for weekly leaderboard). */
    completedAt: v.optional(v.number()),
    firstAccessedAt: v.optional(v.number()),
    lastAccessedAt: v.optional(v.number()),
    timeSpentSeconds: v.number(), // aggregated
  })
    .index("by_user_lesson", ["userId", "lessonId"])
    .index("by_user_module", ["userId", "moduleId"]),

  // ── Certificates (program-level; legacy moduleId rows migrated away) ──
  certificates: defineTable({
    userId: v.id("users"),
    programId: v.optional(v.id("trainingPrograms")),
    organizationId: v.id("organizations"),
    generalExamAttemptId: v.optional(v.id("generalExamAttempts")),
    /** @deprecated Removed after migration — was per-module certificate */
    moduleId: v.optional(v.id("modules")),
    examAttemptId: v.optional(v.id("examAttempts")),
    score: v.number(),
    issuedAt: v.number(),
    certificateNumber: v.optional(v.string()),
    fileUrl: v.optional(v.string()), // generated PDF in Convex storage
  })
    .index("by_user", ["userId"])
    .index("by_user_program", ["userId", "programId"])
    .index("by_user_module", ["userId", "moduleId"])
    .index("by_certificate_number", ["certificateNumber"]),

  // ── Certificate Templates ──────────────────────────────────────
  certificateTemplates: defineTable({
    organizationId: v.id("organizations"),
    layoutId: v.optional(
      v.union(v.literal("classic"), v.literal("premium"))
    ),
    organizationName: v.string(),
    programSubtitle: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    secondLogoUrl: v.optional(v.string()),
    secondLogoStorageId: v.optional(v.id("_storage")),
    signatureLine: v.optional(v.string()),
    signature2Line: v.optional(v.string()),
    signatureImageUrl: v.optional(v.string()),
    signatureImageStorageId: v.optional(v.id("_storage")),
    signature2ImageUrl: v.optional(v.string()),
    signature2ImageStorageId: v.optional(v.id("_storage")),
    borderColor: v.string(), // hex
    accentColor: v.optional(v.string()),
    backgroundImageUrl: v.optional(v.string()),
    backgroundImageStorageId: v.optional(v.id("_storage")),
    footerText: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_org", ["organizationId"]),

  // ── Notifications ──────────────────────────────────────────────
  notifications: defineTable({
    recipientId: v.id("users"),
    organizationId: v.id("organizations"),
    type: v.literal("exam_passed"),
    learnerId: v.id("users"),
    moduleId: v.id("modules"),
    score: v.number(),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_recipient", ["recipientId"])
    .index("by_recipient_unread", ["recipientId", "read"]),

  // ── Module Email Notification Settings ────────────────────────
  moduleNotificationSettings: defineTable({
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    adminId: v.id("users"),
    emailEnabled: v.boolean(),
  }).index("by_module_admin", ["moduleId", "adminId"]),
});
