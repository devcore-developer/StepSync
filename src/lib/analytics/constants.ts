export const MILESTONE_AT_RISK_DAYS = 3;

export const DAY_NAMES_AR = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

export const USMLE_STAGE_LABELS: Record<string, string> = {
  PREPARING_STEP1: "Step 1",
  PREPARING_STEP2CK: "Step 2 CK",
  PREPARING_STEP3: "Step 3",
};

export const PLAN_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "نشط",
  COMPLETED: "مكتمل",
  PAUSED: "متوقف",
  ABANDONED: "متروك",
};

export const HEALTH_STATUS_LABELS: Record<string, string> = {
  ON_TRACK: "على المسار",
  AT_RISK: "في خطر",
  BEHIND: "متأخر",
  CRITICAL: "حرج",
  COMPLETED: "مكتمل",
};

export const HEALTH_STATUS_COLORS: Record<string, string> = {
  ON_TRACK: "text-green-600 bg-green-50 border-green-200",
  AT_RISK: "text-amber-600 bg-amber-50 border-amber-200",
  BEHIND: "text-orange-600 bg-orange-50 border-orange-200",
  CRITICAL: "text-red-600 bg-red-50 border-red-200",
  COMPLETED: "text-blue-600 bg-blue-50 border-blue-200",
};

export const MILESTONE_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "لم يبدأ",
  IN_PROGRESS: "جاري",
  COMPLETED: "مكتمل",
  PAUSED: "متوقف",
};

export const RESCHEDULE_TRIGGER_LABELS: Record<string, string> = {
  AUTO: "تلقائي",
  MANUAL: "يدوي",
};

export const AI_TYPE_LABELS: Record<string, string> = {
  PLAN_REVIEW: "مراجعة الخطة",
  RESCHEDULE: "إعادة جدولة",
  CAPACITY: "السعة",
};