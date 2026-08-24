export const RESCHEDULING_CONFIG = {
  /** Default daily study capacity in hours */
  DEFAULT_DAILY_STUDY_HOURS: 4,

  /** Default task duration in minutes (fallback if estimatedDuration is null) */
  DEFAULT_TASK_DURATION_MINUTES: 30,

  /** Minimum hours between reschedule operations (cooldown) */
  RESCHEDULE_COOLDOWN_HOURS: 24,

  /** Maximum days to look ahead when building schedule */
  MAX_SCHEDULE_DAYS: 365,

  /** Days per week for studying (7 = every day) */
  STUDY_DAYS_PER_WEEK: 7,
} as const;

export const RESCHEDULE_TRIGGER = {
  AUTO: "AUTO",
  MANUAL: "MANUAL",
} as const;

export type RescheduleTrigger = (typeof RESCHEDULE_TRIGGER)[keyof typeof RESCHEDULE_TRIGGER];