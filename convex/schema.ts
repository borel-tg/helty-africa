import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Organizations ──────────────────────────────────────────────
  organizations: defineTable({
    name: v.string(),
    slug: v.string(), // url-safe identifier
    logoUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  // ── Users ──────────────────────────────────────────────────────
  users: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.union(
      v.literal("super_admin"),
      v.literal("admin"),
      v.literal("lead"),
      v.literal("learner")
    ),
    status: v.union(v.literal("active"), v.literal("inactive")),
    leadId: v.optional(v.id("users")), // learner's assigned lead
    passwordHash: v.optional(v.string()),
    mustChangePassword: v.optional(v.boolean()),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
    // Convex Auth token subject (used by auth)
    tokenIdentifier: v.optional(v.string()),
  })
    .index("by_org", ["organizationId"])
    .index("by_email", ["email"])
    .index("by_token", ["tokenIdentifier"])
    .index("by_lead", ["leadId"]),

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
    fileType: v.optional(v.union(v.literal("pdf"), v.literal("ppt"))),
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
    firstAccessedAt: v.optional(v.number()),
    lastAccessedAt: v.optional(v.number()),
    timeSpentSeconds: v.number(), // aggregated
  })
    .index("by_user_lesson", ["userId", "lessonId"])
    .index("by_user_module", ["userId", "moduleId"]),

  // ── Certificates ───────────────────────────────────────────────
  certificates: defineTable({
    userId: v.id("users"),
    moduleId: v.id("modules"),
    organizationId: v.id("organizations"),
    examAttemptId: v.id("examAttempts"),
    score: v.number(),
    issuedAt: v.number(),
    fileUrl: v.optional(v.string()), // generated PDF in Convex storage
  })
    .index("by_user", ["userId"])
    .index("by_user_module", ["userId", "moduleId"]),

  // ── Certificate Templates ──────────────────────────────────────
  certificateTemplates: defineTable({
    organizationId: v.id("organizations"),
    organizationName: v.string(),
    logoUrl: v.optional(v.string()),
    signatureLine: v.optional(v.string()),
    borderColor: v.string(), // hex
    backgroundImageUrl: v.optional(v.string()),
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
