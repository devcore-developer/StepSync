export const DRIFT_THRESHOLDS = {
  AT_RISK_MIN_DAYS: 1,
  AT_RISK_MAX_DAYS: 2,
  BEHIND_MIN_DAYS: 3,
  BEHIND_MAX_DAYS: 5,
  CRITICAL_MIN_DAYS: 6,
} as const;

export const DRIFT_STATUS = {
  ON_TRACK: "ON_TRACK",
  AT_RISK: "AT_RISK",
  BEHIND: "BEHIND",
  CRITICAL: "CRITICAL",
  COMPLETED: "COMPLETED",
} as const;

export type DriftStatus = (typeof DRIFT_STATUS)[keyof typeof DRIFT_STATUS];

export const ACCOUNTABILITY_MESSAGES: Record<
  Exclude<DriftStatus, "COMPLETED">,
  { title: string; description: string }
> = {
  ON_TRACK: {
    title: "أنت على المسار الصحيح",
    description: "استمر — أنت بالضبط في المكان المطلوب.",
  },
  AT_RISK: {
    title: "أنت متأخر قليلاً",
    description: "عندك بعض المهام اللي محتاج تلحقها.",
  },
  BEHIND: {
    title: "أنت متأخر {days} أيام",
    description: "هنعاودك للمسار الصحيح.",
  },
  CRITICAL: {
    title: "خطتك محتاجة اهتمام",
    description: "عدة مهام متأخرة. هنعدّل خطتك لاحقاً.",
  },
};

export const NOTIFICATION_CONFIG = {
  COOLDOWN_HOURS: 24,
} as const;