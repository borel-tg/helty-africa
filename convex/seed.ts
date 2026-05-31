import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed the database with demo data for development/testing.
 * Run once via: npx convex run seed:seedDemo
 */
export const seedDemo = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Clear existing demo data to keep this seed idempotent.
    const tableNames = [
      "moduleNotificationSettings",
      "notifications",
      "certificates",
      "generalExamAttempts",
      "generalExamSettings",
      "generalExamQuestions",
      "programEnrollments",
      "trainingProgramModules",
      "trainingPrograms",
      "lessonProgress",
      "examAttempts",
      "examSettings",
      "examQuestions",
      "moduleResources",
      "lessons",
      "modules",
      "invitations",
      "certificateTemplates",
      "users",
      "organizations",
    ] as const;

    for (const table of tableNames) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }

    // Organization
    const orgId = await ctx.db.insert("organizations", {
      name: "PolioFree Africa NGO",
      slug: "poliofree-africa",
      createdAt: now,
    });

    // Users
    const superAdminId = await ctx.db.insert("users", {
      organizationId: orgId,
      name: "Dr. Amara Diallo",
      email: "superadmin@helty.africa",
      phone: "+221 77 000 0001",
      role: "super_admin",
      status: "active",
      createdAt: now - 90 * 86400000,
      lastLoginAt: now - 3600000,
    });
    const adminId = await ctx.db.insert("users", {
      organizationId: orgId,
      name: "Sophie Mensah",
      email: "admin@helty.africa",
      phone: "+233 20 000 0002",
      role: "admin",
      status: "active",
      createdAt: now - 60 * 86400000,
      lastLoginAt: now - 7200000,
    });
    const leadId = await ctx.db.insert("users", {
      organizationId: orgId,
      name: "Kwame Asante",
      email: "lead@helty.africa",
      phone: "+233 24 000 0003",
      role: "lead",
      status: "active",
      createdAt: now - 45 * 86400000,
      lastLoginAt: now - 86400000,
    });
    const learner1Id = await ctx.db.insert("users", {
      organizationId: orgId,
      name: "Fatima Coulibaly",
      email: "learner@helty.africa",
      phone: "+225 07 000 0004",
      role: "learner",
      status: "active",
      leadId,
      createdAt: now - 30 * 86400000,
      lastLoginAt: now - 43200000,
    });
    const learner2Id = await ctx.db.insert("users", {
      organizationId: orgId,
      name: "Ibrahim Traoré",
      email: "ibrahim@helty.africa",
      phone: "+226 70 000 0005",
      role: "learner",
      status: "active",
      leadId,
      createdAt: now - 25 * 86400000,
      lastLoginAt: now - 86400000,
    });
    const learner3Id = await ctx.db.insert("users", {
      organizationId: orgId,
      name: "Amina Diallo",
      email: "amina@helty.africa",
      phone: "+221 76 000 0006",
      role: "learner",
      status: "active",
      leadId,
      createdAt: now - 20 * 86400000,
      lastLoginAt: now - 2 * 86400000,
    });

    // Modules
    const module1Id = await ctx.db.insert("modules", {
      organizationId: orgId,
      title: "Polio Campaign Protocols",
      description:
        "Comprehensive training on polio vaccination campaign protocols, cold chain management, and community engagement strategies.",
      status: "published",
      order: 0,
      passingScore: 70,
      maxRetakes: 3,
      createdBy: adminId,
      createdAt: now - 20 * 86400000,
      updatedAt: now - 2 * 86400000,
    });
    const module2Id = await ctx.db.insert("modules", {
      organizationId: orgId,
      title: "Community Engagement & Communication",
      description:
        "Strategies for effective community mobilization, addressing vaccine hesitancy, and building trust with caregivers.",
      status: "published",
      order: 1,
      passingScore: 70,
      maxRetakes: 3,
      createdBy: adminId,
      createdAt: now - 15 * 86400000,
      updatedAt: now - 86400000,
    });
    const module3Id = await ctx.db.insert("modules", {
      organizationId: orgId,
      title: "Safety & Emergency Protocols",
      description:
        "Handling adverse events following immunization (AEFI) and emergency procedures during field campaigns.",
      status: "published",
      order: 2,
      passingScore: 70,
      maxRetakes: 3,
      createdBy: adminId,
      createdAt: now - 5 * 86400000,
      updatedAt: now - 86400000,
    });

    // Lessons for module 1
    const les1Id = await ctx.db.insert("lessons", {
      moduleId: module1Id,
      organizationId: orgId,
      title: "Introduction to Polio Eradication",
      description: "Understanding the global polio eradication initiative",
      type: "text",
      content: `<h2>What is Polio?</h2><p>Poliomyelitis (polio) is a highly contagious viral disease that largely affects children under 5 years of age.</p><h2>The Global Mission</h2><p>The Global Polio Eradication Initiative is the largest internationally coordinated public health effort in history.</p>`,
      order: 0,
      createdAt: now - 20 * 86400000,
      updatedAt: now - 2 * 86400000,
    });
    const les2Id = await ctx.db.insert("lessons", {
      moduleId: module1Id,
      organizationId: orgId,
      title: "Vaccination Techniques & Safety",
      description: "Proper administration of oral polio vaccine",
      type: "video",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      videoId: "dQw4w9WgXcQ",
      order: 1,
      createdAt: now - 20 * 86400000,
      updatedAt: now - 2 * 86400000,
    });
    const les3Id = await ctx.db.insert("lessons", {
      moduleId: module1Id,
      organizationId: orgId,
      title: "Cold Chain Management Guide",
      description: "Maintaining vaccine potency through proper cold chain",
      type: "document",
      fileType: "pdf",
      fileName: "sample-pdf.pdf",
      fileUrl: "/demo/sample-pdf.pdf",
      order: 2,
      createdAt: now - 20 * 86400000,
      updatedAt: now - 2 * 86400000,
    });
    await ctx.db.insert("lessons", {
      moduleId: module1Id,
      organizationId: orgId,
      title: "Cold Chain Presentation Deck (PPT)",
      description: "PowerPoint lesson for cold-chain field procedures",
      type: "document",
      fileType: "ppt",
      fileName: "sample-ppt.ppt",
      fileUrl: "/demo/sample-ppt.ppt",
      order: 3,
      createdAt: now - 20 * 86400000,
      updatedAt: now - 2 * 86400000,
    });
    await ctx.db.insert("lessons", {
      moduleId: module1Id,
      organizationId: orgId,
      title: "Google Slides: Customer Journey Map",
      description: "External Google Slides test lesson",
      type: "document",
      fileType: "ppt",
      fileName: "google-slides-customer-journey.ppt",
      fileUrl:
        "https://docs.google.com/presentation/d/1MpHz7blYDiKfEjibZYsfCUjU8BXT0D5NI2rA8R-5ziM/edit?usp=sharing",
      order: 4,
      createdAt: now - 20 * 86400000,
      updatedAt: now - 2 * 86400000,
    });
    await ctx.db.insert("lessons", {
      moduleId: module1Id,
      organizationId: orgId,
      title: "Google Doc: Borel TG Photo CV (PDF view)",
      description: "External Google Docs test lesson rendered as PDF",
      type: "document",
      fileType: "pdf",
      fileName: "google-doc-borel-cv.pdf",
      fileUrl:
        "https://docs.google.com/document/d/1QAFmTOmZSwfJPuV5QRlhhWpLirH9AYA84KrxZqHhoXo/edit?usp=sharing",
      order: 5,
      createdAt: now - 20 * 86400000,
      updatedAt: now - 2 * 86400000,
    });

    // Lessons for module 2
    await ctx.db.insert("lessons", {
      moduleId: module2Id,
      organizationId: orgId,
      title: "Understanding Vaccine Hesitancy",
      type: "text",
      content: `<h2>Why Parents Refuse Vaccines</h2><p>Vaccine hesitancy is complex and context-specific. It includes a spectrum of attitudes: complacency, inconvenience, and lack of confidence.</p>`,
      order: 0,
      createdAt: now - 15 * 86400000,
      updatedAt: now - 86400000,
    });
    await ctx.db.insert("lessons", {
      moduleId: module2Id,
      organizationId: orgId,
      title: "Communication Scripts for Caregivers",
      type: "document",
      fileType: "ppt",
      fileName: "sample-ppt.ppt",
      fileUrl: "/demo/sample-ppt.ppt",
      order: 1,
      createdAt: now - 15 * 86400000,
      updatedAt: now - 86400000,
    });

    // Module resources
    const resourceRows = [
      {
        moduleId: module1Id,
        title: "Cold Chain Quick Checklist (PDF)",
        description:
          "Printable one-page cold chain checklist for field teams.",
        type: "pdf" as const,
        url: "/demo/sample-pdf.pdf",
        fileName: "sample-pdf.pdf",
        downloadable: true,
      },
      {
        moduleId: module1Id,
        title: "Cold Chain Refresher Slides",
        description:
          "Slide deck covering vaccine storage and transport basics.",
        type: "ppt" as const,
        url: "/demo/sample-ppt.ppt",
        fileName: "sample-ppt.ppt",
        downloadable: true,
      },
      {
        moduleId: module1Id,
        title: "WHO Vaccine Handling Video",
        description: "Short external video reference for safe handling in field.",
        type: "video" as const,
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        downloadable: false,
      },
      {
        moduleId: module1Id,
        title: "Google Slides Reference Deck",
        description: "Open external Google Slides deck shared for learners.",
        type: "link" as const,
        url: "https://docs.google.com/presentation/d/1MpHz7blYDiKfEjibZYsfCUjU8BXT0D5NI2rA8R-5ziM/edit?usp=sharing",
        downloadable: false,
      },
      {
        moduleId: module1Id,
        title: "Google Doc Field Notes",
        description: "External Google Docs handbook for quick review.",
        type: "link" as const,
        url: "https://docs.google.com/document/d/1QAFmTOmZSwfJPuV5QRlhhWpLirH9AYA84KrxZqHhoXo/edit?usp=sharing",
        downloadable: false,
      },
      {
        moduleId: module2Id,
        title: "Communication Field Notes",
        description: "External Google Docs reference for communication tips.",
        type: "link" as const,
        url: "https://docs.google.com/document/d/1QAFmTOmZSwfJPuV5QRlhhWpLirH9AYA84KrxZqHhoXo/edit?usp=sharing",
        downloadable: false,
      },
    ];
    for (let i = 0; i < resourceRows.length; i++) {
      const resource = resourceRows[i];
      await ctx.db.insert("moduleResources", {
        moduleId: resource.moduleId,
        organizationId: orgId,
        title: resource.title,
        description: resource.description,
        type: resource.type,
        url: resource.url,
        fileName: resource.fileName,
        downloadable: resource.downloadable,
        order: i,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Exam for module 1
    const q1Id = await ctx.db.insert("examQuestions", {
      moduleId: module1Id,
      organizationId: orgId,
      questionText:
        "At what temperature should oral polio vaccine (OPV) be stored?",
      options: [
        { id: "a", text: "Between 2°C and 8°C" },
        { id: "b", text: "Between -15°C and -25°C" },
        { id: "c", text: "At room temperature (20-25°C)" },
        { id: "d", text: "Between 10°C and 15°C" },
      ],
      correctOptionId: "a",
      order: 0,
      createdAt: now,
    });
    const q2Id = await ctx.db.insert("examQuestions", {
      moduleId: module1Id,
      organizationId: orgId,
      questionText:
        "Which age group is most vulnerable to polio paralysis?",
      options: [
        { id: "a", text: "Adults over 40" },
        { id: "b", text: "Children under 5 years" },
        { id: "c", text: "Teenagers aged 13-18" },
        { id: "d", text: "Elderly over 65" },
      ],
      correctOptionId: "b",
      order: 1,
      createdAt: now,
    });
    await ctx.db.insert("examQuestions", {
      moduleId: module1Id,
      organizationId: orgId,
      questionText: "What does OPV stand for?",
      options: [
        { id: "a", text: "Official Polio Vaccination" },
        { id: "b", text: "Oral Polio Vaccine" },
        { id: "c", text: "Obligatory Preventive Vaccination" },
        { id: "d", text: "Optimized Polio Viral agent" },
      ],
      correctOptionId: "b",
      order: 2,
      createdAt: now,
    });
    await ctx.db.insert("examQuestions", {
      moduleId: module1Id,
      organizationId: orgId,
      questionText:
        "How many drops of OPV are typically administered to a child?",
      options: [
        { id: "a", text: "1 drop" },
        { id: "b", text: "2 drops" },
        { id: "c", text: "5 drops" },
        { id: "d", text: "10 drops" },
      ],
      correctOptionId: "b",
      order: 3,
      createdAt: now,
    });
    await ctx.db.insert("examQuestions", {
      moduleId: module1Id,
      organizationId: orgId,
      questionText: "What is the primary route of polio virus transmission?",
      options: [
        { id: "a", text: "Airborne droplets" },
        { id: "b", text: "Mosquito bites" },
        { id: "c", text: "Fecal-oral route" },
        { id: "d", text: "Direct blood contact" },
      ],
      correctOptionId: "c",
      order: 4,
      createdAt: now,
    });

    await ctx.db.insert("examSettings", {
      moduleId: module1Id,
      organizationId: orgId,
      timeLimitMinutes: 30,
      showCorrectAnswers: true,
      allowReview: true,
      randomizeQuestions: false,
    });
    await ctx.db.insert("examSettings", {
      moduleId: module2Id,
      organizationId: orgId,
      timeLimitMinutes: 20,
      showCorrectAnswers: true,
      allowReview: true,
      randomizeQuestions: false,
    });

    // Progress
    await ctx.db.insert("lessonProgress", {
      userId: learner1Id,
      lessonId: les1Id,
      moduleId: module1Id,
      organizationId: orgId,
      completed: true,
      firstAccessedAt: now - 3 * 86400000,
      lastAccessedAt: now - 2 * 86400000,
      timeSpentSeconds: 720,
    });
    await ctx.db.insert("lessonProgress", {
      userId: learner1Id,
      lessonId: les2Id,
      moduleId: module1Id,
      organizationId: orgId,
      completed: true,
      firstAccessedAt: now - 2 * 86400000,
      lastAccessedAt: now - 86400000,
      timeSpentSeconds: 480,
    });
    await ctx.db.insert("lessonProgress", {
      userId: learner1Id,
      lessonId: les3Id,
      moduleId: module1Id,
      organizationId: orgId,
      completed: false,
      firstAccessedAt: now - 86400000,
      lastAccessedAt: now - 3600000,
      timeSpentSeconds: 120,
    });

    // Module 2 & 3 exam questions (minimal)
    const m2q1 = await ctx.db.insert("examQuestions", {
      moduleId: module2Id,
      organizationId: orgId,
      questionText: "What is vaccine hesitancy?",
      options: [
        { id: "a", text: "Delay or refusal of vaccination despite availability" },
        { id: "b", text: "Allergic reaction to vaccines" },
        { id: "c", text: "Mandatory vaccination policy" },
        { id: "d", text: "Cold chain failure" },
      ],
      correctOptionId: "a",
      order: 0,
      createdAt: now,
    });
    await ctx.db.insert("examQuestions", {
      moduleId: module3Id,
      organizationId: orgId,
      questionText: "What does AEFI stand for?",
      options: [
        { id: "a", text: "Adverse Events Following Immunization" },
        { id: "b", text: "Advanced Emergency Field Intervention" },
        { id: "c", text: "Approved Equipment for Immunization" },
        { id: "d", text: "Annual Evaluation of Field Indicators" },
      ],
      correctOptionId: "a",
      order: 0,
      createdAt: now,
    });

    // ── Training program ─────────────────────────────────────────────
    const programId = await ctx.db.insert("trainingPrograms", {
      organizationId: orgId,
      title: "Polio Field Worker Certification",
      description:
        "Complete all module tests and the final evaluation to earn your program certificate.",
      status: "published",
      accessMode: "open",
      evaluationPolicy: {
        programPassThreshold: 80,
        moduleExamWeight: 70,
        generalExamWeight: 30,
        generalExamEnabled: true,
        generalExamMaxRetakes: 3,
        unlockGeneralExamMode: "all_module_attempts",
      },
      createdBy: adminId,
      createdAt: now - 10 * 86400000,
      updatedAt: now,
    });

    for (const [order, moduleId] of [
      [0, module1Id],
      [1, module2Id],
      [2, module3Id],
    ] as const) {
      await ctx.db.insert("trainingProgramModules", {
        programId,
        moduleId,
        organizationId: orgId,
        order,
      });
    }

    const genQ1 = await ctx.db.insert("generalExamQuestions", {
      programId,
      organizationId: orgId,
      questionText:
        "At what temperature should oral polio vaccine (OPV) be stored?",
      options: [
        { id: "a", text: "Between 2°C and 8°C" },
        { id: "b", text: "Between -15°C and -25°C" },
        { id: "c", text: "At room temperature (20-25°C)" },
        { id: "d", text: "Between 10°C and 15°C" },
      ],
      correctOptionId: "a",
      sourceModuleQuestionId: q1Id,
      order: 0,
      createdAt: now,
    });
    await ctx.db.insert("generalExamQuestions", {
      programId,
      organizationId: orgId,
      questionText: "What is vaccine hesitancy?",
      options: [
        { id: "a", text: "Delay or refusal of vaccination despite availability" },
        { id: "b", text: "Allergic reaction to vaccines" },
        { id: "c", text: "Mandatory vaccination policy" },
        { id: "d", text: "Cold chain failure" },
      ],
      correctOptionId: "a",
      sourceModuleQuestionId: m2q1,
      order: 1,
      createdAt: now,
    });

    await ctx.db.insert("generalExamSettings", {
      programId,
      organizationId: orgId,
      timeLimitMinutes: 45,
      showCorrectAnswers: true,
      allowReview: true,
      randomizeQuestions: false,
    });

    // Enrollments
    await ctx.db.insert("programEnrollments", {
      userId: learner1Id,
      programId,
      organizationId: orgId,
      enrolledAt: now - 20 * 86400000,
    });
    await ctx.db.insert("programEnrollments", {
      userId: learner2Id,
      programId,
      organizationId: orgId,
      enrolledAt: now - 15 * 86400000,
      finalScore: 81.5,
      passed: true,
      completedAt: now - 7000000,
    });

    // Exam attempts — learner2 (John-style: 80, 70, 90 module + 85 general → 81.5)
    const submitModuleAttempt = async (
      userId: typeof learner2Id,
      moduleId: typeof module1Id,
      score: number,
      attemptNumber: number,
      offset: number
    ) => {
      const mod = await ctx.db.get(moduleId);
      return ctx.db.insert("examAttempts", {
        userId,
        moduleId,
        organizationId: orgId,
        attemptNumber,
        answers: [],
        score,
        passed: mod ? score >= mod.passingScore : false,
        startedAt: now - offset,
        submittedAt: now - offset + 60000,
      });
    };

    await submitModuleAttempt(learner2Id, module1Id, 80, 1, 8000000);
    await submitModuleAttempt(learner2Id, module2Id, 70, 1, 7500000);
    await submitModuleAttempt(learner2Id, module3Id, 90, 1, 7200000);

    const generalAttemptId = await ctx.db.insert("generalExamAttempts", {
      userId: learner2Id,
      programId,
      organizationId: orgId,
      attemptNumber: 1,
      answers: [{ questionId: genQ1, selectedOptionId: "a" }],
      score: 85,
      startedAt: now - 7100000,
      submittedAt: now - 7000000,
    });

    await ctx.db.insert("certificates", {
      userId: learner2Id,
      programId,
      organizationId: orgId,
      generalExamAttemptId: generalAttemptId,
      score: 81.5,
      issuedAt: now - 7000000,
      certificateNumber: "EVT-2026-DEMO01",
    });

    // learner1 partial progress on module 1
    await ctx.db.insert("examAttempts", {
      userId: learner1Id,
      moduleId: module1Id,
      organizationId: orgId,
      attemptNumber: 1,
      answers: [
        { questionId: q1Id, selectedOptionId: "a" },
        { questionId: q2Id, selectedOptionId: "b" },
      ],
      score: 75,
      passed: true,
      startedAt: now - 3600000,
      submittedAt: now - 3500000,
    });

    // Notifications
    await ctx.db.insert("notifications", {
      recipientId: leadId,
      organizationId: orgId,
      type: "exam_passed",
      learnerId: learner1Id,
      moduleId: module1Id,
      score: 85,
      read: false,
      createdAt: now - 3600000,
    });
    await ctx.db.insert("notifications", {
      recipientId: leadId,
      organizationId: orgId,
      type: "exam_passed",
      learnerId: learner2Id,
      moduleId: module1Id,
      score: 72,
      read: false,
      createdAt: now - 7200000,
    });
    await ctx.db.insert("notifications", {
      recipientId: leadId,
      organizationId: orgId,
      type: "exam_passed",
      learnerId: learner3Id,
      moduleId: module2Id,
      score: 91,
      read: true,
      createdAt: now - 2 * 86400000,
    });

    await ctx.db.insert("moduleNotificationSettings", {
      moduleId: module1Id,
      organizationId: orgId,
      adminId,
      emailEnabled: true,
    });

    await ctx.db.insert("certificateTemplates", {
      organizationId: orgId,
      organizationName: "PolioFree Africa NGO",
      programSubtitle: "Employee Training Programme",
      signatureLine: "Dr. Amara Diallo, Training Director",
      borderColor: "#2E7D64",
      accentColor: "#2E7D64",
      footerText:
        "This document certifies completion of the stated training module as recorded in the organization's training system.",
      updatedAt: now,
    });

    // Invitation sample
    await ctx.db.insert("invitations", {
      organizationId: orgId,
      email: "new.staff@helty.africa",
      token: "seed-invite-token",
      role: "learner",
      invitedBy: adminId,
      expiresAt: now + 7 * 86400000,
      createdAt: now,
    });

    return {
      success: true,
      orgId,
      programId,
      superAdminId,
      adminId,
      leadId,
      learner1Id,
      module1Id,
      module2Id,
      module3Id,
    };
  },
});
