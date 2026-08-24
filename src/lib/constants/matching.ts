export const MATCHING_WEIGHTS = {
  SYSTEM: 40,
  CHAPTER: 30,
  STUDY_TIME: 15,
  ACADEMIC_YEAR: 10,
  LOCATION: 10,
  USMLE_STAGE: 10,
  GENDER: 5,
} as const;

export const STUDY_TIMES = ["MORNING", "AFTERNOON", "EVENING", "FLEXIBLE"] as const;
export type StudyTime = (typeof STUDY_TIMES)[number];

export const STUDY_TIME_LABELS: Record<string, string> = {
  MORNING: "صباح",
  AFTERNOON: "بعد الظهر",
  EVENING: "مساء",
  FLEXIBLE: "مرن",
};

export const USMLE_STAGE_LABELS: Record<string, string> = {
  PREPARING_STEP1: "Step 1",
  PREPARING_STEP2CK: "Step 2 CK",
  PREPARING_STEP3: "Step 3",
};

export const GENDER_LABELS: Record<string, string> = {
  MALE: "ذكر",
  FEMALE: "أنثى",
  OTHER: "آخر",
  PREFER_NOT_TO_SAY: "لا يفضل الإفصاح",
};

/** ترتيب إزالة الفلاتر عند "توسيع البحث" (الأقل أهمية أولاً) */
export const FILTER_REMOVAL_ORDER = [
  "gender",
  "usmleStage",
  "academicYear",
  "chapterId",
  "systemId",
] as const;

export const MATCHING_CONFIG = {
  MAX_CANDIDATE_POOL: 200,
  MAX_RESULTS: 20,
  RANDOMIZATION_BAND: 3,
} as const;