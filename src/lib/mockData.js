/**
 * Mock data for UI development / demo mode.
 * When Convex is connected with real data, this is not used.
 */

import {
  DEMO_PDF_URL,
  DEMO_PDF_NAME,
  DEMO_PPT_URL,
  DEMO_PPT_NAME,
} from "./demoAssets";

export const MOCK_ORG = {
  _id: "org1",
  name: "PolioFree Africa NGO",
  slug: "poliofree-africa",
};

export const MOCK_USERS = {
  superAdmin: {
    _id: "user_super",
    organizationId: "org1",
    name: "Dr. Amara Diallo",
    email: "superadmin@helty.africa",
    phone: "+221 77 000 0001",
    role: "super_admin",
    status: "active",
    createdAt: Date.now() - 90 * 86400000,
    lastLoginAt: Date.now() - 3600000,
  },
  admin: {
    _id: "user_admin",
    organizationId: "org1",
    name: "Sophie Mensah",
    email: "admin@helty.africa",
    phone: "+233 20 000 0002",
    role: "admin",
    status: "active",
    createdAt: Date.now() - 60 * 86400000,
    lastLoginAt: Date.now() - 7200000,
  },
  lead: {
    _id: "user_lead",
    organizationId: "org1",
    name: "Kwame Asante",
    email: "lead@helty.africa",
    phone: "+233 24 000 0003",
    role: "lead",
    status: "active",
    createdAt: Date.now() - 45 * 86400000,
    lastLoginAt: Date.now() - 86400000,
  },
  learner: {
    _id: "user_learner",
    organizationId: "org1",
    name: "Fatima Coulibaly",
    email: "learner@helty.africa",
    phone: "+225 07 000 0004",
    role: "learner",
    status: "active",
    leadId: "user_lead",
    createdAt: Date.now() - 30 * 86400000,
    lastLoginAt: Date.now() - 43200000,
  },
};

export const MOCK_MODULES = [
  {
    _id: "mod1",
    organizationId: "org1",
    title: "Polio Campaign Protocols",
    description:
      "Comprehensive training on polio vaccination campaign protocols, cold chain management, and community engagement strategies.",
    status: "published",
    order: 0,
    passingScore: 70,
    maxRetakes: 3,
    createdBy: "user_admin",
    createdAt: Date.now() - 20 * 86400000,
    updatedAt: Date.now() - 2 * 86400000,
  },
  {
    _id: "mod2",
    organizationId: "org1",
    title: "Community Engagement & Communication",
    description:
      "Strategies for effective community mobilization, addressing vaccine hesitancy, and building trust with caregivers.",
    status: "published",
    order: 1,
    passingScore: 70,
    maxRetakes: 3,
    createdBy: "user_admin",
    createdAt: Date.now() - 15 * 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    _id: "mod3",
    organizationId: "org1",
    title: "Safety & Emergency Protocols",
    description:
      "Handling adverse events following immunization (AEFI) and emergency procedures during field campaigns.",
    status: "published",
    order: 2,
    passingScore: 70,
    maxRetakes: 3,
    createdBy: "user_admin",
    createdAt: Date.now() - 5 * 86400000,
    updatedAt: Date.now() - 86400000,
  },
];

export const MOCK_LESSONS = {
  mod1: [
    {
      _id: "les1",
      moduleId: "mod1",
      title: "Introduction to Polio Eradication",
      description: "Understanding the global polio eradication initiative",
      type: "text",
      order: 0,
      content: `<h2>What is Polio?</h2>
<p>Poliomyelitis (polio) is a highly contagious viral disease that largely affects children under 5 years of age. The virus is transmitted by person-to-person, mainly through the fecal-oral route or, less frequently, by a common vehicle (e.g. contaminated water or food).</p>
<h2>The Global Mission</h2>
<p>The Global Polio Eradication Initiative (GPEI) is the largest internationally coordinated public health effort in history. Our mission is to eradicate polio worldwide through mass vaccination campaigns and surveillance.</p>
<h2>Your Role as a Field Worker</h2>
<p>As a vaccination campaign worker, you are at the frontline of polio eradication. Your work directly contributes to protecting millions of children from paralysis. Key responsibilities include:</p>
<ul>
<li>Administering oral polio vaccine (OPV) correctly</li>
<li>Maintaining the cold chain to ensure vaccine efficacy</li>
<li>Engaging with communities and addressing concerns</li>
<li>Recording accurate vaccination data</li>
</ul>`,
      createdAt: Date.now() - 20 * 86400000,
      updatedAt: Date.now() - 2 * 86400000,
    },
    {
      _id: "les2",
      moduleId: "mod1",
      title: "Vaccination Techniques & Safety",
      description: "Proper administration of oral polio vaccine",
      type: "video",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      videoId: "dQw4w9WgXcQ",
      order: 1,
      createdAt: Date.now() - 20 * 86400000,
      updatedAt: Date.now() - 2 * 86400000,
    },
    {
      _id: "les3",
      moduleId: "mod1",
      title: "Cold Chain Management Guide",
      description: "Maintaining vaccine potency through proper cold chain",
      type: "document",
      fileType: "pdf",
      fileName: DEMO_PDF_NAME,
      fileUrl: DEMO_PDF_URL,
      order: 2,
      createdAt: Date.now() - 20 * 86400000,
      updatedAt: Date.now() - 2 * 86400000,
    },
    {
      _id: "les6",
      moduleId: "mod1",
      title: "Cold Chain Presentation Deck (PPT)",
      description: "PowerPoint lesson for cold-chain field procedures",
      type: "document",
      fileType: "ppt",
      fileName: DEMO_PPT_NAME,
      fileUrl: DEMO_PPT_URL,
      order: 3,
      createdAt: Date.now() - 20 * 86400000,
      updatedAt: Date.now() - 2 * 86400000,
    },
    {
      _id: "les7",
      moduleId: "mod1",
      title: "Google Slides: Customer Journey Map",
      description: "External Google Slides test lesson",
      type: "document",
      fileType: "ppt",
      fileName: "google-slides-customer-journey.ppt",
      fileUrl:
        "https://docs.google.com/presentation/d/1MpHz7blYDiKfEjibZYsfCUjU8BXT0D5NI2rA8R-5ziM/edit?usp=sharing",
      order: 4,
      createdAt: Date.now() - 20 * 86400000,
      updatedAt: Date.now() - 2 * 86400000,
    },
    {
      _id: "les8",
      moduleId: "mod1",
      title: "Google Doc: Borel TG Photo CV (PDF view)",
      description: "External Google Docs test lesson rendered as PDF",
      type: "document",
      fileType: "pdf",
      fileName: "google-doc-borel-cv.pdf",
      fileUrl:
        "https://docs.google.com/document/d/1QAFmTOmZSwfJPuV5QRlhhWpLirH9AYA84KrxZqHhoXo/edit?usp=sharing",
      order: 5,
      createdAt: Date.now() - 20 * 86400000,
      updatedAt: Date.now() - 2 * 86400000,
    },
  ],
  mod2: [
    {
      _id: "les4",
      moduleId: "mod2",
      title: "Understanding Vaccine Hesitancy",
      type: "text",
      order: 0,
      content: `<h2>Why Parents Refuse Vaccines</h2>
<p>Vaccine hesitancy is complex and context-specific. It includes a spectrum of attitudes: complacency (low perceived risk), inconvenience, and lack of confidence (distrust of vaccine or provider).</p>
<h2>Common Misconceptions</h2>
<p>Field workers frequently encounter these concerns: religious objections, rumours about vaccine side effects, and conspiracy theories. Learning to address these respectfully and with evidence is critical.</p>`,
      createdAt: Date.now() - 15 * 86400000,
      updatedAt: Date.now() - 86400000,
    },
    {
      _id: "les5",
      moduleId: "mod2",
      title: "Communication Scripts for Caregivers",
      type: "document",
      fileType: "ppt",
      fileName: DEMO_PPT_NAME,
      fileUrl: DEMO_PPT_URL,
      order: 1,
      createdAt: Date.now() - 15 * 86400000,
      updatedAt: Date.now() - 86400000,
    },
  ],
};

export const MOCK_EXAM_QUESTIONS = {
  mod1: [
    {
      _id: "q1",
      moduleId: "mod1",
      questionText: "At what temperature should oral polio vaccine (OPV) be stored?",
      options: [
        { id: "a", text: "Between 2°C and 8°C" },
        { id: "b", text: "Between -15°C and -25°C" },
        { id: "c", text: "At room temperature (20-25°C)" },
        { id: "d", text: "Between 10°C and 15°C" },
      ],
      correctOptionId: "a",
      order: 0,
    },
    {
      _id: "q2",
      moduleId: "mod1",
      questionText: "Which age group is most vulnerable to polio paralysis?",
      options: [
        { id: "a", text: "Adults over 40" },
        { id: "b", text: "Children under 5 years" },
        { id: "c", text: "Teenagers aged 13-18" },
        { id: "d", text: "Elderly over 65" },
      ],
      correctOptionId: "b",
      order: 1,
    },
    {
      _id: "q3",
      moduleId: "mod1",
      questionText: "What does OPV stand for?",
      options: [
        { id: "a", text: "Official Polio Vaccination" },
        { id: "b", text: "Oral Polio Vaccine" },
        { id: "c", text: "Obligatory Preventive Vaccination" },
        { id: "d", text: "Optimized Polio Viral agent" },
      ],
      correctOptionId: "b",
      order: 2,
    },
    {
      _id: "q4",
      moduleId: "mod1",
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
    },
    {
      _id: "q5",
      moduleId: "mod1",
      questionText:
        "What is the primary route of polio virus transmission?",
      options: [
        { id: "a", text: "Airborne droplets" },
        { id: "b", text: "Mosquito bites" },
        { id: "c", text: "Fecal-oral route" },
        { id: "d", text: "Direct blood contact" },
      ],
      correctOptionId: "c",
      order: 4,
    },
  ],
};

export const MOCK_MODULE_RESOURCES = {
  mod1: [
    {
      _id: "res1",
      moduleId: "mod1",
      title: "Cold Chain Quick Checklist (PDF)",
      description: "Printable one-page cold chain checklist for field teams.",
      type: "pdf",
      url: DEMO_PDF_URL,
      fileName: DEMO_PDF_NAME,
      downloadable: true,
    },
    {
      _id: "res2",
      moduleId: "mod1",
      title: "Cold Chain Refresher Slides",
      description: "Slide deck covering vaccine storage and transport basics.",
      type: "ppt",
      url: DEMO_PPT_URL,
      fileName: DEMO_PPT_NAME,
      downloadable: true,
    },
    {
      _id: "res3",
      moduleId: "mod1",
      title: "WHO Vaccine Handling Video",
      description: "Short external video reference for safe handling in field.",
      type: "video",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      downloadable: false,
    },
    {
      _id: "res4",
      moduleId: "mod1",
      title: "Google Slides Reference Deck",
      description: "Open external Google Slides deck shared for learners.",
      type: "link",
      url: "https://docs.google.com/presentation/d/1MpHz7blYDiKfEjibZYsfCUjU8BXT0D5NI2rA8R-5ziM/edit?usp=sharing",
      downloadable: false,
    },
    {
      _id: "res5",
      moduleId: "mod1",
      title: "Google Doc Field Notes",
      description: "External Google Docs handbook for quick review.",
      type: "link",
      url: "https://docs.google.com/document/d/1QAFmTOmZSwfJPuV5QRlhhWpLirH9AYA84KrxZqHhoXo/edit?usp=sharing",
      downloadable: false,
    },
  ],
  mod2: [
    {
      _id: "res6",
      moduleId: "mod2",
      title: "Caregiver Communication Scripts",
      description: "Downloadable talking points for field communication.",
      type: "pdf",
      url: DEMO_PDF_URL,
      fileName: DEMO_PDF_NAME,
      downloadable: true,
    },
  ],
};

export const MOCK_LEARNER_PROGRESS = {
  // lessonId -> { completed, timeSpentSeconds }
  les1: { completed: true, timeSpentSeconds: 720 },
  les2: { completed: true, timeSpentSeconds: 480 },
  les3: { completed: false, timeSpentSeconds: 120 },
};

export const MOCK_EMPLOYEES = [
  {
    _id: "user_learner",
    name: "Fatima Coulibaly",
    email: "fatima@helty.africa",
    phone: "+225 07 000 0004",
    role: "learner",
    status: "active",
    leadId: "user_lead",
    lastLoginAt: Date.now() - 43200000,
    createdAt: Date.now() - 30 * 86400000,
  },
  {
    _id: "user_learner2",
    name: "Ibrahim Traoré",
    email: "ibrahim@helty.africa",
    phone: "+226 70 000 0005",
    role: "learner",
    status: "active",
    leadId: "user_lead",
    lastLoginAt: Date.now() - 86400000,
    createdAt: Date.now() - 25 * 86400000,
  },
  {
    _id: "user_learner3",
    name: "Amina Diallo",
    email: "amina@helty.africa",
    phone: "+221 76 000 0006",
    role: "learner",
    status: "active",
    leadId: "user_lead",
    lastLoginAt: Date.now() - 2 * 86400000,
    createdAt: Date.now() - 20 * 86400000,
  },
  {
    _id: "user_learner4",
    name: "Kofi Boateng",
    email: "kofi@helty.africa",
    phone: "+233 55 000 0007",
    role: "learner",
    status: "inactive",
    lastLoginAt: Date.now() - 10 * 86400000,
    createdAt: Date.now() - 35 * 86400000,
  },
  {
    _id: "user_lead",
    name: "Kwame Asante",
    email: "kwame@helty.africa",
    phone: "+233 24 000 0003",
    role: "lead",
    status: "active",
    lastLoginAt: Date.now() - 86400000,
    createdAt: Date.now() - 45 * 86400000,
  },
  {
    _id: "user_admin",
    name: "Sophie Mensah",
    email: "sophie@helty.africa",
    phone: "+233 20 000 0002",
    role: "admin",
    status: "active",
    lastLoginAt: Date.now() - 7200000,
    createdAt: Date.now() - 60 * 86400000,
  },
];

export const MOCK_INVITATIONS = [
  {
    _id: "inv1",
    email: "new.learner1@helty.africa",
    role: "learner",
    status: "pending",
    invitedAt: Date.now() - 2 * 86400000,
    expiresAt: Date.now() + 5 * 86400000,
    usedAt: null,
  },
  {
    _id: "inv2",
    email: "new.learner2@helty.africa",
    role: "learner",
    status: "signed_up",
    invitedAt: Date.now() - 8 * 86400000,
    expiresAt: Date.now() - 1 * 86400000,
    usedAt: Date.now() - 3 * 86400000,
  },
  {
    _id: "inv3",
    email: "new.lead@helty.africa",
    role: "lead",
    status: "expired",
    invitedAt: Date.now() - 12 * 86400000,
    expiresAt: Date.now() - 5 * 86400000,
    usedAt: null,
  },
];

export const MOCK_STATS = {
  totalEmployees: 42,
  totalModulesPublished: 2,
  overallCompletionRate: 38,
  avgTimePerModule: "1h 24m",
  moduleStats: [
    {
      moduleId: "mod1",
      title: "Polio Campaign Protocols",
      started: 38,
      completedLessons: 29,
      passed: 22,
      failed: 4,
      avgScore: 76,
      avgAttempts: 1.4,
    },
    {
      moduleId: "mod2",
      title: "Community Engagement",
      started: 25,
      completedLessons: 18,
      passed: 16,
      failed: 2,
      avgScore: 81,
      avgAttempts: 1.2,
    },
  ],
};

/** Demo training program (evaluation + certificate unit). */
export const MOCK_TRAINING_PROGRAM = {
  _id: "prog1",
  organizationId: "org1",
  title: "Polio Field Worker Certification",
  description:
    "Complete all module tests and the final evaluation to earn your program certificate.",
  status: "published",
  accessMode: "open",
  moduleIds: ["mod1", "mod2", "mod3"],
  evaluationPolicy: {
    programPassThreshold: 80,
    moduleExamWeight: 70,
    generalExamWeight: 30,
    generalExamEnabled: true,
    generalExamMaxRetakes: 3,
    unlockGeneralExamMode: "all_module_attempts",
  },
};

/** Per-user mock module exam bests (user_learner) */
export const MOCK_PROGRAM_EXAM_BEST = {
  user_learner: { mod1: 75, mod2: null, mod3: null },
  user_learner2: { mod1: 80, mod2: 70, mod3: 90 },
};

export const MOCK_GENERAL_EXAM_BEST = {
  user_learner: null,
  user_learner2: 85,
};

export const MOCK_PROGRAM_ENROLLMENTS = {
  user_learner: ["prog1"],
  user_learner2: ["prog1"],
};

export const MOCK_PROGRAM_CERTIFICATES = {
  user_learner2: {
    programId: "prog1",
    score: 81.5,
    issuedAt: Date.now() - 7000000,
    certificateNumber: "EVT-2026-DEMO01",
  },
};

export const MOCK_GENERAL_EXAM_QUESTIONS = [
  {
    _id: "genq1",
    programId: "prog1",
    questionText: "At what temperature should oral polio vaccine (OPV) be stored?",
    options: [
      { id: "a", text: "Between 2°C and 8°C" },
      { id: "b", text: "Between -15°C and -25°C" },
      { id: "c", text: "At room temperature (20-25°C)" },
      { id: "d", text: "Between 10°C and 15°C" },
    ],
    correctOptionId: "a",
    order: 0,
  },
  {
    _id: "genq2",
    programId: "prog1",
    questionText: "What is vaccine hesitancy?",
    options: [
      { id: "a", text: "Delay or refusal of vaccination despite availability" },
      { id: "b", text: "Allergic reaction to vaccines" },
      { id: "c", text: "Mandatory vaccination policy" },
      { id: "d", text: "Cold chain failure" },
    ],
    correctOptionId: "a",
    order: 1,
  },
];

export const MOCK_NOTIFICATIONS = [
  {
    _id: "notif1",
    type: "exam_passed",
    learnerId: "user_learner",
    learnerName: "Fatima Coulibaly",
    moduleId: "mod1",
    moduleName: "Polio Campaign Protocols",
    score: 85,
    read: false,
    createdAt: Date.now() - 3600000,
  },
  {
    _id: "notif2",
    type: "exam_passed",
    learnerId: "user_learner2",
    learnerName: "Ibrahim Traoré",
    moduleId: "mod1",
    moduleName: "Polio Campaign Protocols",
    score: 72,
    read: false,
    createdAt: Date.now() - 7200000,
  },
  {
    _id: "notif3",
    type: "exam_passed",
    learnerId: "user_learner3",
    learnerName: "Amina Diallo",
    moduleId: "mod2",
    moduleName: "Community Engagement",
    score: 91,
    read: true,
    createdAt: Date.now() - 2 * 86400000,
  },
];
