import {
  PrismaClient,
  ResourceType,
  ScheduleTemplateStatus,
  TaskType,
  UsmleStage,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════
//  REFERENCE DATA — USMLE Step 1 Marathon Curriculum
//  EXACTLY 18 SYSTEMS — Source of Truth
//  [name, slug, description, order, durationDays]
// ═══════════════════════════════════════════════════

const SYSTEMS: [string, string, string, number, number][] = [
  ["Pathology", "pathology", "Cell injury, inflammation, neoplasia", 1, 5],
  ["Biochemistry", "biochemistry", "Metabolism, enzymes, genetics", 2, 20],
  ["Immunology", "immunology", "Adaptive, innate, disorders", 3, 8],
  ["Microbiology", "microbiology", "Bacteria, viruses, fungi, parasites", 4, 20],
  ["Neuroscience", "neuroscience", "CNS, PNS, autonomic, meninges", 5, 21],
  ["Psychiatry", "psychiatry", "Disorders, psychopharmacology", 6, 10],
  ["Musculoskeletal", "musculoskeletal", "Bone, muscle, joints, skin", 7, 7],
  ["Dermatology", "dermatology", "Skin lesions, infections, neoplasms", 8, 3],
  ["Cardiovascular", "cardiovascular", "Heart, vessels, hemodynamics", 9, 21],
  ["Hematology", "hematology", "RBC, WBC, platelets, coagulation", 10, 10],
  ["Renal", "renal", "Nephron, AKI, CKD, electrolytes", 11, 9],
  ["Endocrine", "endocrine", "Hormones, diabetes, thyroid, adrenal", 12, 10],
  ["Gastrointestinal", "gastrointestinal", "GI tract, liver, pancreas", 13, 12],
  ["Reproductive", "reproductive", "Male/female, embryology, placenta", 14, 7],
  ["Respiratory", "respiratory", "Lungs, ventilation, gas exchange", 15, 9],
  ["Ethics", "ethics", "Medical ethics, legal, professionalism", 16, 4],
  ["Biostatistics", "biostatistics", "Study design, analysis, interpretation", 17, 5],
  ["General Pharmacology", "general-pharmacology", "General principles, autonomic, CV, CNS", 18, 5],
];

const CHAPTERS: [string, string][] = [
  // Pathology (5 days)
  ["pathology", "Cellular Injury & Death"],
  ["pathology", "Inflammation & Repair"],
  ["pathology", "Neoplasia"],
  ["pathology", "Hemodynamic Disorders"],
  ["pathology", "Immune Pathology"],

  // Biochemistry (20 days)
  ["biochemistry", "Protein Structure & Enzymes"],
  ["biochemistry", "Carbohydrate Metabolism"],
  ["biochemistry", "Lipid Metabolism"],
  ["biochemistry", "Amino Acid Metabolism"],
  ["biochemistry", "Nucleotide Metabolism"],
  ["biochemistry", "Vitamins & Minerals"],
  ["biochemistry", "Molecular Biology"],
  ["biochemistry", "Genetics"],

  // Immunology (8 days)
  ["immunology", "Innate Immunity"],
  ["immunology", "Adaptive Immunity — Cell-Mediated"],
  ["immunology", "Adaptive Immunity — Humoral"],
  ["immunology", "Hypersensitivity Reactions"],
  ["immunology", "Immunodeficiency Disorders"],
  ["immunology", "Autoimmune Disorders"],
  ["immunology", "Transplant Immunology"],

  // Microbiology (20 days)
  ["microbiology", "Gram Positive Bacteria"],
  ["microbiology", "Gram Negative Bacteria"],
  ["microbiology", "Acid-Fast & Atypical Bacteria"],
  ["microbiology", "DNA Viruses"],
  ["microbiology", "RNA Viruses"],
  ["microbiology", "Fungi"],
  ["microbiology", "Parasites"],
  ["microbiology", "Antimicrobial Agents"],

  // Neuroscience (21 days)
  ["neuroscience", "Gross Anatomy of CNS"],
  ["neuroscience", "Spinal Cord & Tracts"],
  ["neuroscience", "Brainstem & Cranial Nerves"],
  ["neuroscience", "Cerebellum & Basal Ganglia"],
  ["neuroscience", "Thalamus & Cerebral Cortex"],
  ["neuroscience", "Visual System"],
  ["neuroscience", "Auditory & Vestibular Systems"],
  ["neuroscience", "Autonomic Nervous System"],
  ["neuroscience", "Limbic System & Memory"],
  ["neuroscience", "Neuropharmacology"],

  // Psychiatry (10 days)
  ["psychiatry", "Mood Disorders"],
  ["psychiatry", "Anxiety & Somatoform Disorders"],
  ["psychiatry", "Psychotic Disorders"],
  ["psychiatry", "Personality Disorders"],
  ["psychiatry", "Substance Use Disorders"],
  ["psychiatry", "Child & Adolescent Psychiatry"],
  ["psychiatry", "Psychopharmacology"],

  // Musculoskeletal (7 days)
  ["musculoskeletal", "Bone Physiology & Pathology"],
  ["musculoskeletal", "Joint Diseases"],
  ["musculoskeletal", "Muscle Disorders"],
  ["musculoskeletal", "Soft Tissue & Bone Tumors"],

  // Dermatology (3 days)
  ["dermatology", "Basic Dermatology & Skin Structure"],
  ["dermatology", "Skin Infections & Inflammatory Conditions"],
  ["dermatology", "Skin Neoplasms"],

  // Cardiovascular (21 days)
  ["cardiovascular", "Cardiac Anatomy & Physiology"],
  ["cardiovascular", "Ischemic Heart Disease"],
  ["cardiovascular", "Arrhythmias"],
  ["cardiovascular", "Heart Failure"],
  ["cardiovascular", "Valvular Heart Disease"],
  ["cardiovascular", "Vascular Diseases"],
  ["cardiovascular", "Congenital Heart Disease"],
  ["cardiovascular", "Cardiac Pharmacology"],

  // Hematology (10 days)
  ["hematology", "RBC Disorders & Anemia"],
  ["hematology", "WBC Disorders"],
  ["hematology", "Platelet Disorders"],
  ["hematology", "Coagulation Disorders"],
  ["hematology", "Transfusion Medicine"],
  ["hematology", "Hematologic Malignancies"],

  // Renal (9 days)
  ["renal", "Renal Physiology"],
  ["renal", "Acute Kidney Injury"],
  ["renal", "Chronic Kidney Disease"],
  ["renal", "Glomerular Diseases"],
  ["renal", "Tubulointerstitial Diseases"],
  ["renal", "Electrolyte & Acid-Base Disorders"],

  // Endocrine (10 days)
  ["endocrine", "Pituitary Disorders"],
  ["endocrine", "Thyroid Disorders"],
  ["endocrine", "Adrenal Disorders"],
  ["endocrine", "Diabetes Mellitus"],
  ["endocrine", "Calcium & Bone Metabolism"],
  ["endocrine", "Endocrine Tumors"],

  // Gastrointestinal (12 days)
  ["gastrointestinal", "Esophageal Disorders"],
  ["gastrointestinal", "Gastric Disorders"],
  ["gastrointestinal", "Small Intestine Disorders"],
  ["gastrointestinal", "Large Intestine Disorders"],
  ["gastrointestinal", "Liver Disorders"],
  ["gastrointestinal", "Pancreas & Biliary Disorders"],
  ["gastrointestinal", "GI Pharmacology"],

  // Reproductive (7 days)
  ["reproductive", "Male Reproductive System"],
  ["reproductive", "Female Reproductive System"],
  ["reproductive", "Embryology"],
  ["reproductive", "Placenta & Pregnancy"],
  ["reproductive", "Menstrual Cycle & Fertility"],

  // Respiratory (9 days)
  ["respiratory", "Pulmonary Physiology"],
  ["respiratory", "Obstructive Lung Diseases"],
  ["respiratory", "Restrictive Lung Diseases"],
  ["respiratory", "Pulmonary Vascular Disease"],
  ["respiratory", "Respiratory Infections"],
  ["respiratory", "Pleural Disease"],

  // Ethics (4 days)
  ["ethics", "Medical Ethics Principles"],
  ["ethics", "End-of-Life Care"],
  ["ethics", "Legal Issues in Medicine"],
  ["ethics", "Professionalism & Boundary Setting"],

  // Biostatistics (5 days)
  ["biostatistics", "Study Design & Bias"],
  ["biostatistics", "Statistical Tests"],
  ["biostatistics", "Interpretation of Results"],
  ["biostatistics", "Screening & Prevention"],
  ["biostatistics", "Epidemiology"],

  // General Pharmacology (5 days)
  ["general-pharmacology", "Pharmacokinetics"],
  ["general-pharmacology", "Pharmacodynamics"],
  ["general-pharmacology", "Autonomic Pharmacology"],
  ["general-pharmacology", "CV & CNS Drug Classes"],
  ["general-pharmacology", "Antimicrobial Pharmacology"],
];

// ═══════════════════════════════════════════════════════════════
//  TEMPLATE MILESTONES — 18 systems, authoritative structure
// ═══════════════════════════════════════════════════

interface MilestoneDef {
  title: string;
  system: string;
  start: number;
  end: number;
  topics: string[];
}

const MILESTONES: MilestoneDef[] = [
  // 1. Pathology — 5 days (days 1–5)
  {
    title: "Pathology",
    system: "pathology",
    start: 1,
    end: 5,
    topics: [
      "Cell Injury & Death",
      "Inflammation & Repair",
      "Neoplasia",
      "Hemodynamic Disorders",
      "Immune Pathology",
    ],
  },
  // 2. Biochemistry — 20 days (days 6–25)
  {
    title: "Biochemistry",
    system: "biochemistry",
    start: 6,
    end: 25,
    topics: [
      "Proteins & Enzymes",
      "Carbohydrate Metabolism",
      "Lipid Metabolism",
      "Amino Acid Metabolism",
      "Nucleotide Metabolism",
      "Vitamins & Minerals",
      "Molecular Biology",
      "Genetics",
    ],
  },
  // 3. Immunology — 8 days (days 26–33)
  {
    title: "Immunology",
    system: "immunology",
    start: 26,
    end: 33,
    topics: [
      "Innate Immunity",
      "Adaptive Immunity — Cell-Mediated",
      "Adaptive Immunity — Humoral",
      "Hypersensitivity Reactions",
      "Immunodeficiency Disorders",
      "Autoimmune Disorders",
      "Transplant Immunology",
    ],
  },
  // 4. Microbiology — 20 days (days 34–53)
  {
    title: "Microbiology",
    system: "microbiology",
    start: 34,
    end: 53,
    topics: [
      "Gram Positive Bacteria",
      "Gram Negative Bacteria",
      "Acid-Fast & Atypical Bacteria",
      "DNA Viruses",
      "RNA Viruses",
      "Fungi",
      "Parasites",
      "Antimicrobial Agents",
    ],
  },
  // 5. Neuroscience — 21 days (days 54–74)
  {
    title: "Neuroscience",
    system: "neuroscience",
    start: 54,
    end: 74,
    topics: [
      "Gross CNS Anatomy",
      "Spinal Cord & Tracts",
      "Brainstem & Cranial Nerves",
      "Cerebellum & Basal Ganglia",
      "Thalamus & Cerebral Cortex",
      "Visual System",
      "Auditory & Vestibular Systems",
      "Autonomic Nervous System",
      "Limbic System & Memory",
      "Neuropharmacology",
    ],
  },
  // 6. Psychiatry — 10 days (days 75–84)
  {
    title: "Psychiatry",
    system: "psychiatry",
    start: 75,
    end: 84,
    topics: [
      "Mood Disorders",
      "Anxiety & Somatoform Disorders",
      "Psychotic Disorders",
      "Personality Disorders",
      "Substance Use Disorders",
      "Child & Adolescent Psychiatry",
      "Psychopharmacology",
    ],
  },
  // 7. Musculoskeletal — 7 days (days 85–91)
  {
    title: "Musculoskeletal",
    system: "musculoskeletal",
    start: 85,
    end: 91,
    topics: [
      "Bone Physiology & Pathology",
      "Joint Diseases",
      "Muscle Disorders",
      "Soft Tissue & Bone Tumors",
    ],
  },
  // 8. Dermatology — 3 days (days 92–94)
  {
    title: "Dermatology",
    system: "dermatology",
    start: 92,
    end: 94,
    topics: [
      "Basic Dermatology & Skin Structure",
      "Skin Infections & Inflammatory Conditions",
      "Skin Neoplasms",
    ],
  },
  // 9. Cardiovascular — 21 days (days 95–115)
  {
    title: "Cardiovascular",
    system: "cardiovascular",
    start: 95,
    end: 115,
    topics: [
      "Cardiac Anatomy & Physiology",
      "Ischemic Heart Disease",
      "Arrhythmias",
      "Heart Failure",
      "Valvular Heart Disease",
      "Vascular Diseases",
      "Congenital Heart Disease",
      "Cardiac Pharmacology",
    ],
  },
  // 10. Hematology — 10 days (days 116–125)
  {
    title: "Hematology",
    system: "hematology",
    start: 116,
    end: 125,
    topics: [
      "RBC Disorders & Anemia",
      "WBC Disorders",
      "Platelet Disorders",
      "Coagulation Disorders",
      "Transfusion Medicine",
      "Hematologic Malignancies",
    ],
  },
  // 11. Renal — 9 days (days 126–134)
  {
    title: "Renal",
    system: "renal",
    start: 126,
    end: 134,
    topics: [
      "Renal Physiology",
      "Acute Kidney Injury",
      "Chronic Kidney Disease",
      "Glomerular Diseases",
      "Tubulointerstitial Diseases",
      "Electrolyte & Acid-Base Disorders",
    ],
  },
  // 12. Endocrine — 10 days (days 135–144)
  {
    title: "Endocrine",
    system: "endocrine",
    start: 135,
    end: 144,
    topics: [
      "Pituitary Disorders",
      "Thyroid Disorders",
      "Adrenal Disorders",
      "Diabetes Mellitus",
      "Calcium & Bone Metabolism",
      "Endocrine Tumors",
    ],
  },
  // 13. Gastrointestinal — 12 days (days 145–156)
  {
    title: "Gastrointestinal",
    system: "gastrointestinal",
    start: 145,
    end: 156,
    topics: [
      "Esophageal Disorders",
      "Gastric Disorders",
      "Small Intestine Disorders",
      "Large Intestine Disorders",
      "Liver Disorders",
      "Pancreas & Biliary Disorders",
      "GI Pharmacology",
    ],
  },
  // 14. Reproductive — 7 days (days 157–163)
  {
    title: "Reproductive",
    system: "reproductive",
    start: 157,
    end: 163,
    topics: [
      "Male Reproductive System",
      "Female Reproductive System",
      "Embryology",
      "Placenta & Pregnancy",
      "Menstrual Cycle & Fertility",
    ],
  },
  // 15. Respiratory — 9 days (days 164–172)
  {
    title: "Respiratory",
    system: "respiratory",
    start: 164,
    end: 172,
    topics: [
      "Pulmonary Physiology",
      "Obstructive Lung Diseases",
      "Restrictive Lung Diseases",
      "Pulmonary Vascular Disease",
      "Respiratory Infections",
      "Pleural Disease",
    ],
  },
  // 16. Ethics — 4 days (days 173–176)
  {
    title: "Ethics",
    system: "ethics",
    start: 173,
    end: 176,
    topics: [
      "Medical Ethics Principles",
      "End-of-Life Care",
      "Legal Issues in Medicine",
      "Professionalism & Boundary Setting",
    ],
  },
  // 17. Biostatistics — 5 days (days 177–181)
  {
    title: "Biostatistics",
    system: "biostatistics",
    start: 177,
    end: 181,
    topics: [
      "Study Design & Bias",
      "Statistical Tests",
      "Interpretation of Results",
      "Screening & Prevention",
      "Epidemiology",
    ],
  },
  // 18. General Pharmacology — 5 days (days 182–186)
  {
    title: "General Pharmacology",
    system: "general-pharmacology",
    start: 182,
    end: 186,
    topics: [
      "Pharmacokinetics",
      "Pharmacodynamics",
      "Autonomic Pharmacology",
      "CV & CNS Drug Classes",
      "Antimicrobial Pharmacology",
    ],
  },
];

// ═══════════════════════════════════════════════════
//  DEMO USERS
// ═══════════════════════════════════════

const DEMO_USERS = [
  { email: "demo.beginner@stepsync.dev", firstName: "أحمد", lastName: "المبتدئ", password: "Demo1234!", usmleStage: "PREPARING_STEP1", progressCutoff: 0 },
  { email: "demo.consistent@stepsync.dev", firstName: "سارة", lastName: "المنتظمة", password: "Demo1234!", usmleStage: "PREPARING_STEP1", progressCutoff: 60, daysAgo: 60 },
  { email: "demo.behind@stepsync.dev", firstName: "خالد", lastName: "المتأخر", password: "Demo1234!", usmleStage: "PREPARING_STEP1", progressCutoff: 40, daysAgo: 80 },
  { email: "demo.ahead@stepsync.dev", firstName: "نورا", lastName: "المتفوقة", password: "Demo1234!", usmleStage: "PREPARING_STEP1", progressCutoff: 108, daysAgo: 108 },
  { email: "demo.nearexam@stepsync.dev", firstName: "عمر", lastName: "القريب", password: "Demo1234!", usmleStage: "PREPARING_STEP1", progressCutoff: 200, daysAgo: 200 },
];

// ═══════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════

interface CreatedUser {
  email: string;
  id: string;
  planStartDate?: Date;
}

function addDays(date: Date, days: number): Date {
  const r = new Date(date);
  r.setDate(r.getDate() + days);
  r.setHours(0, 0, 0, 0);
  return r;
}

function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

/**
 * Generate tasks for a milestone by distributing topics
 * across the available days, with QBANK blocks and a final review.
 */
function generateTasks(m: MilestoneDef): {
  title: string;
  type: TaskType;
  day: number;
  hours: number;
  optional?: boolean;
  order: number;
}[] {
  const tasks: {
    title: string;
    type: TaskType;
    day: number;
    hours: number;
    optional?: boolean;
    order: number;
  }[] = [];
  const duration = m.end - m.start + 1;
  let order = 0;

  // Very short milestones (≤ 4 days): compact format
  if (duration <= 4) {
    order++;
    tasks.push({
      title: `Review: ${m.topics.slice(0, 2).join(" & ")}`,
      type: "NOTES",
      day: m.start,
      hours: 2,
      order,
    });

    if (m.topics.length > 2) {
      order++;
      tasks.push({
        title: `Review: ${m.topics.slice(2).join(" & ")}`,
        type: "NOTES",
        day: m.start + 1,
        hours: 1.5,
        order,
      });
    }

    if (duration >= 3) {
      order++;
      tasks.push({
        title: "Practice questions",
        type: "QBANK",
        day: Math.min(m.start + Math.floor(duration / 2), m.end - 1),
        hours: 1,
        order,
      });
    }

    order++;
    tasks.push({
      title: "Milestone review",
      type: "REVIEW",
      day: m.end,
      hours: 1.5,
      order,
    });

    return tasks;
  }

  // Normal flow for milestones > 4 days
  const reviewDay = m.end;
  const workDays = duration - 1;
  const n = m.topics.length;

  m.topics.forEach((topic, i) => {
    const day = m.start + Math.round((i / Math.max(n - 1, 1)) * (workDays - 1));
    const clampedDay = Math.max(m.start, Math.min(day, reviewDay - 1));

    order++;
    tasks.push({
      title: `Review: ${topic}`,
      type: "NOTES",
      day: clampedDay,
      hours: 1.5,
      order,
    });

    if (i % 2 === 1 && clampedDay < reviewDay - 1) {
      order++;
      tasks.push({
        title: "Practice questions",
        type: "QBANK",
        day: Math.min(clampedDay + 1, reviewDay - 1),
        hours: 1,
        order,
      });
    }
  });

  order++;
  tasks.push({
    title: "Milestone review & consolidation",
    type: "REVIEW",
    day: reviewDay,
    hours: 1.5,
    order,
  });

  return tasks;
}

// ═══════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════

async function main() {
  console.log("🌱 Seeding StepSync demo data...");

  const TEMPLATE_SLUG = "marathon-step1-18-systems";
  const demoEmails = DEMO_USERS.map((u) => u.email);
  const systemSlugs = SYSTEMS.map(([, slug]) => slug);

  // ═══════════════════════════════════════════════════
  //  IDEMPOTENT CLEANUP — delete ALL seed-created data
  // ═══════════════════════════════════════

  // 1. Demo users and everything that references them
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: demoEmails } },
    select: { id: true },
  });

  if (existingUsers.length > 0) {
    const ids = existingUsers.map((u) => u.id);

    await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
    await prisma.aIRecommendation.deleteMany({ where: { userId: { in: ids } } });

    const planTaskIds = await prisma.studyPlanTask.findMany({
      where: { milestone: { plan: { userId: { in: ids } } } },
      select: { id: true },
    });
    if (planTaskIds.length > 0) {
      await prisma.studyPlanTask.deleteMany({ where: { id: { in: planTaskIds.map((t) => t.id) } } });
    }

    const planMilestoneIds = await prisma.studyPlanMilestone.findMany({
      where: { plan: { userId: { in: ids } } },
      select: { id: true },
    });
    if (planMilestoneIds.length > 0) {
      await prisma.studyPlanMilestone.deleteMany({ where: { id: { in: planMilestoneIds.map((m) => m.id) } } });
    }

    await prisma.studyPlanReschedule.deleteMany({ where: { studyPlan: { userId: { in: ids } } } });
    await prisma.studyPlan.deleteMany({ where: { userId: { in: ids } } });
    await prisma.profile.deleteMany({ where: { userId: { in: ids } } });
    await prisma.notificationPreference.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { email: { in: demoEmails } } });

    console.log("  🧹 Cleaned demo users & plans");
  }

  // 2. ALL templates (clean slate — removes old templates with wrong data)
  const allTemplateIds = await prisma.scheduleTemplate.findMany({
    select: { id: true },
  });

  if (allTemplateIds.length > 0) {
    const tmplIds = allTemplateIds.map((t) => t.id);

    const tmplTaskIds = await prisma.scheduleTemplateTask.findMany({
      where: { milestone: { templateId: { in: tmplIds } } },
      select: { id: true },
    });
    if (tmplTaskIds.length > 0) {
      await prisma.scheduleTemplateTask.deleteMany({ where: { id: { in: tmplTaskIds.map((t) => t.id) } } });
    }

    await prisma.scheduleTemplateMilestone.deleteMany({ where: { templateId: { in: tmplIds } } });
    await prisma.scheduleTemplate.deleteMany({ where: { id: { in: tmplIds } } });

    console.log("  🧹 Cleaned ALL templates (clean slate)");
  }

  // 3. ALL systems and chapters (clean slate — removes old 3-system demo data)
  const allSystemIds = await prisma.usmleSystem.findMany({
    select: { id: true },
  });

  if (allSystemIds.length > 0) {
    const sysIds = allSystemIds.map((s) => s.id);
    await prisma.chapter.deleteMany({ where: { systemId: { in: sysIds } } });
    await prisma.usmleSystem.deleteMany({ where: { id: { in: sysIds } } });

    console.log("  🧹 Cleaned ALL systems & chapters (removes old demo data)");
  }

  // ═══════════════════════════════════════════════════
  //  CREATE — Systems
  // ═══════════════════════════════════════

  const systemMap: Record<string, string> = {};
  for (const [name, slug, desc, order] of SYSTEMS) {
    const sys = await prisma.usmleSystem.create({
      data: { name, slug, description: desc, order },
    });
    systemMap[slug] = sys.id;
  }
  console.log(`  ✓ Created ${SYSTEMS.length} systems`);

  // ═══════════════════════════════════════════════════
  //  CREATE — Chapters
  // ═══════════════════════════════════════

  const chapterMap: Record<string, string> = {};
  for (const [systemSlug, chapterName] of CHAPTERS) {
    const sysId = systemMap[systemSlug];
    if (!sysId) continue;
    const ch = await prisma.chapter.create({
      data: {
        systemId: sysId,
        name: chapterName,
        slug: chapterName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        order: Object.keys(chapterMap).length,
      },
    });
    chapterMap[`${systemSlug}:${chapterName}`] = ch.id;
  }
  console.log(`  ✓ Created ${CHAPTERS.length} chapters`);

  // ═══════════════════════════════════════════════════
  //  CREATE — Template
  // ═══════════════════════════════════════

  const totalDays = MILESTONES[MILESTONES.length - 1].end;
  const durationWeeks = Math.ceil(totalDays / 7);

  const template = await prisma.scheduleTemplate.create({
    data: {
      title: "MARATHON — USMLE Step 1 (18 Systems)",
      slug: TEMPLATE_SLUG,
      description: "خطة دراسية مكثفة لامتحان USMLE Step 1 — 18 نظام أساسي مع مهام يومية موزعة حسب المدة المحددة لكل نظام. المدة الإجمالية: 186 يوم (~27 أسبوع)",
      durationWeeks,
      recommendedStudyHours: 40,
      status: ScheduleTemplateStatus.PUBLISHED,
    },
  });
  console.log(`  ✓ Created template (${durationWeeks} weeks, ${totalDays} days)`);

  // ═══════════════════════════════════════════════════
  //  CREATE — Template Milestones & Tasks
  // ═══════════════════════════════════════════════════

  let totalTasksCreated = 0;

  for (let mi = 0; mi < MILESTONES.length; mi++) {
    const mDef = MILESTONES[mi];
    const sysId = systemMap[mDef.system] ?? null;
    const tasks = generateTasks(mDef);

    const milestone = await prisma.scheduleTemplateMilestone.create({
      data: {
        templateId: template.id,
        title: mDef.title,
        systemId: sysId,
        order: mi + 1,
        startDayOffset: mDef.start,
        endDayOffset: mDef.end,
        estimatedWeeks: Math.ceil((mDef.end - mDef.start + 1) / 7),
      },
    });

    for (const tDef of tasks) {
      await prisma.scheduleTemplateTask.create({
        data: {
          milestoneId: milestone.id,
          title: tDef.title,
          type: tDef.type,
          startDayOffset: tDef.day,
          estimatedHours: tDef.hours,
          isOptional: tDef.optional ?? false,
          order: tDef.day * 100 + tDef.hours * 10,
        },
      });
    }

    totalTasksCreated += tasks.length;
  }

  console.log(`  ✓ Created ${MILESTONES.length} milestones with ${totalTasksCreated} tasks`);

  // ═══════════════════════════════════════════════════
  //  CREATE — Demo Users
  // ═══════════════════════════════════════

  const passwordHash = await hashPassword("Demo1234!");
  const userIdMap: Record<string, string> = {};
  const createdUsersList: CreatedUser[] = [];

  for (const du of DEMO_USERS) {
    const user = await prisma.user.create({
      data: {
        email: du.email,
        passwordHash,
        role: "STUDENT",
        isOnboarded: du.progressCutoff > 0,
      },
    });

    userIdMap[du.email] = user.id;
    createdUsersList.push({ email: du.email, id: user.id });

    await prisma.profile.create({
      data: {
        userId: user.id,
        firstName: du.firstName,
        lastName: du.lastName,
        university: "Alexandria University",
        academicYear: "5th Year",
        currentUsmleStage: du.usmleStage as UsmleStage,
        residenceArea: "الإسكندرية",
        preferredStudyTime: "Morning",
        studyPreferences: {
          availableHours: "6-8",
          preferredDays: "6 days/week",
          interestedInPartners: true,
          interestedInGroups: true,
        },
      },
    });

    await prisma.notificationPreference.create({
      data: { userId: user.id },
    });

    console.log(`  ✓ Created user: ${du.email}`);
  }

  // ═══════════════════════════════════════════════════
  //  CREATE — Study Plans for users with progress > 0
  // ═══════════════════════════════════════

  const templateMilestones = await prisma.scheduleTemplateMilestone.findMany({
    where: { templateId: template.id },
    orderBy: { order: "asc" },
    include: {
      tasks: { orderBy: { order: "asc" } },
    },
  });

  for (const du of DEMO_USERS) {
    if (du.progressCutoff === 0) continue;

    const userId = userIdMap[du.email];
    const startDate = addDays(new Date(), -(du.daysAgo ?? 0));

    const plan = await prisma.studyPlan.create({
      data: {
        userId,
        title: "MARATHON — USMLE Step 1 (18 Systems)",
        description: template.description,
        sourceType: "TEMPLATE",
        sourceTemplateId: template.id,
        status: "ACTIVE",
        isActive: true,
        startDate,
      },
    });

    const createdUser = createdUsersList.find((u) => u.email === du.email);
    if (createdUser) createdUser.planStartDate = startDate;

    let planTaskCount = 0;

    for (const tm of templateMilestones) {
      const mStart = tm.startDayOffset != null ? addDays(startDate, tm.startDayOffset - 1) : startDate;
      const mEnd = tm.endDayOffset != null ? addDays(startDate, tm.endDayOffset - 1) : null;

      const planMilestone = await prisma.studyPlanMilestone.create({
        data: {
          planId: plan.id,
          title: tm.title,
          order: tm.order,
          systemId: tm.systemId,
          startDate: mStart,
          targetEndDate: mEnd,
        },
      });

      for (const tt of tm.tasks) {
        const scheduledDate = tt.startDayOffset != null
          ? addDays(startDate, tt.startDayOffset - 1)
          : mStart;
        const isCompleted =
          tt.startDayOffset != null &&
          tt.startDayOffset <= du.progressCutoff &&
          !tt.isOptional;

        await prisma.studyPlanTask.create({
          data: {
            milestoneId: planMilestone.id,
            title: tt.title,
            type: tt.type,
            order: tt.order,
            isOptional: tt.isOptional,
            estimatedHours: tt.estimatedHours,
            scheduledDate,
            originalScheduledDate: scheduledDate,
            status: isCompleted ? "COMPLETED" : "PENDING",
            completedAt: isCompleted
              ? addDays(scheduledDate, Math.floor(Math.random() * 2))
              : null,
          },
        });

        planTaskCount++;
      }
    }

    // Set plan endDate from last task
    const lastTask = await prisma.studyPlanTask.findFirst({
      where: { milestone: { planId: plan.id } },
      orderBy: { scheduledDate: "desc" },
    });
    if (lastTask?.scheduledDate) {
      await prisma.studyPlan.update({
        where: { id: plan.id },
        data: { endDate: lastTask.scheduledDate },
      });
    }

    // Drift notification for behind user
    if (du.email === "demo.behind@stepsync.dev") {
      await prisma.notification.create({
        data: {
          userId,
          type: "DRIFT_WARNING",
          title: "أنت متأخر عن المسار",
          message: "لديك مهام متأخرة تحتاج انتباه فوري. فكّر في إعادة الجدولة.",
        },
      });
    }

    // AI recommendation for near-exam user
    if (du.email === "demo.nearexam@stepsync.dev") {
      await prisma.aIRecommendation.create({
        data: {
          userId,
          studyPlanId: plan.id,
          type: "PLAN_REVIEW",
          summary: "تقدمك ممتاز. ركّز على المراجعة النهائية والمواضيع الضعيفة في الأيام القليلة المتبقية.",
        },
      });
    }

    console.log(`  ✓ Created plan for ${du.email} (${planTaskCount} tasks, ${du.progressCutoff}-day progress)`);
  }

  // ═══════════════════════════════════════════════════
  //  SUMMARY
  // ═══════════════════════════════════════

  console.log("\n" + "=".repeat(50));
  console.log("  STEP SYNC DEMO SEED COMPLETE");
  console.log("  " + "=".repeat(50));
  console.log(`  Template: MARATHON (${MILESTONES.length} milestones, ${totalTasksCreated} tasks)`);
  console.log(`  Systems: ${SYSTEMS.length}`);
  console.log(`  Chapters: ${CHAPTERS.length}`);
  console.log(`  Demo Users: ${DEMO_USERS.length}`);
  console.log(`  Plans Created: ${createdUsersList.filter((u) => u.planStartDate).length}`);
  console.log(`  Total Plan Tasks: ${await prisma.studyPlanTask.count()}`);
  console.log(`  Completed Tasks: ${await prisma.studyPlanTask.count({ where: { status: "COMPLETED" } })}`);
  console.log(`\n  18-System Curriculum:`);
  for (const [name, , , order, duration] of SYSTEMS) {
    console.log(`    ${order.toString().padStart(2, " ")}. ${name.padEnd(25)} — ${duration} days`);
  }
  console.log(`\n  Demo Accounts:`);
  for (const du of DEMO_USERS) {
    const status =
      du.progressCutoff === 0
        ? "BEGINNER"
        : du.email.includes("behind")
          ? "BEHIND"
          : du.email.includes("ahead")
            ? "AHEAD"
            : du.email.includes("near")
              ? "NEAR EXAM"
              : "CONSISTENT";
    console.log(`    ${du.email} / Demo1234! — ${status}`);
  }
  console.log();
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });