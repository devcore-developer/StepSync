// ─── Student Analytics ───

export interface StudentAnalytics {
  plan: {
    id: string;
    title: string;
    startDate: string | null;
    endDate: string | null;
    targetExamDate: string | null;
    status: string;
    sourceType: string;
  };
  overallProgress: OverallProgress;
  consistency: ConsistencyAnalytics;
  weeklyActivity: WeeklyActivityData;
  systemProgress: SystemProgressItem[];
  milestoneAnalytics: MilestoneAnalyticsItem[];
  planHealth: PlanHealthAnalytics;
  rescheduleHistory: RescheduleEntry[];
  aiUsage: AIUsageAnalytics;
}

export interface OverallProgress {
  totalRequiredTasks: number;
  completedRequiredTasks: number;
  remainingRequiredTasks: number;
  completionPercentage: number;
  currentMilestone: string | null;
  completedMilestones: number;
  totalMilestones: number;
  planStartDate: string | null;
  expectedEndDate: string | null;
  projectedEndDate: string | null;
  daysDifference: number | null;
}

export interface ConsistencyAnalytics {
  currentStreak: number;
  longestStreak: number;
  activeStudyDays: number;
  inactiveDays: number;
  completionRate: number;
  avgTasksPerActiveDay: number;
}

export interface WeeklyActivityData {
  daily: DailyActivity[];
  weeklySummary: WeeklySummary;
}

export interface DailyActivity {
  date: string;
  completedRequired: number;
  scheduledRequired: number;
  completionPercentage: number;
}

export interface WeeklySummary {
  totalCompleted: number;
  totalScheduled: number;
  avgDailyCompletion: number;
  bestDay: string | null;
  worstDay: string | null;
}

export interface SystemProgressItem {
  systemId: string;
  systemName: string;
  systemSlug: string;
  totalRequired: number;
  completedRequired: number;
  percentage: number;
}

export interface MilestoneAnalyticsItem {
  id: string;
  title: string;
  startDate: string | null;
  targetEndDate: string | null;
  requiredTaskCount: number;
  completedTaskCount: number;
  progressPercentage: number;
  status: string;
  isCurrent: boolean;
  isAtRisk: boolean;
  order: number;
}

export type PlanHealthStatus =
  | "ON_TRACK"
  | "AT_RISK"
  | "BEHIND"
  | "CRITICAL"
  | "COMPLETED";

export interface PlanHealthAnalytics {
  status: PlanHealthStatus;
  expectedProgress: number;
  actualProgress: number;
  difference: number;
  daysBehind: number;
  overdueTaskCount: number;
  remainingTasks: number;
}

export interface RescheduleEntry {
  date: string;
  trigger: string;
  tasksMoved: number;
  daysShifted: number;
  oldEndDate: string | null;
  newEndDate: string | null;
}

export interface AIUsageAnalytics {
  total: number;
  dailyCount: number;
  planReviews: number;
  rescheduleRecommendations: number;
  capacityRecommendations: number;
  otherCount: number;
  lastRecommendationDate: string | null;
  recent: Array<{ type: string; summary: string; date: string }>;
}

// ─── Platform / Admin Analytics ───

export interface PlatformAnalytics {
  range: string;
  users: PlatformUserMetrics;
  studyPlans: PlatformPlanMetrics;
  engagement: PlatformEngagementMetrics;
  social: PlatformSocialMetrics;
  messaging: PlatformMessagingMetrics;
  notifications: PlatformNotificationMetrics;
  ai: PlatformAIMetrics;
  userGrowth: UserGrowthPoint[];
  taskCompletions: TaskCompletionPoint[];
  distribution: PlatformDistribution;
}

export interface PlatformUserMetrics {
  total: number;
  newThisWeek: number;
  newThisMonth: number;
  newInPeriod: number;
  onboarded: number;
  onboardingRate: number;
}

export interface PlatformPlanMetrics {
  total: number;
  active: number;
  completed: number;
  behind: number;
  atRisk: number;
}

export interface PlatformEngagementMetrics {
  usersActive7d: number;
  usersActive30d: number;
  avgTasksPerActiveUser: number;
  avgPlanProgress: number;
  taskCompletions7d: number;
}

export interface PlatformSocialMetrics {
  totalPartners: number;
  pendingRequests: number;
  activeGroups: number;
  totalGroupMembers: number;
  totalConversations: number;
}

export interface PlatformMessagingMetrics {
  totalMessages: number;
  messagesThisWeek: number;
  activeConversations: number;
}

export interface PlatformNotificationMetrics {
  total: number;
  unread: number;
  createdThisWeek: number;
}

export interface PlatformAIMetrics {
  total: number;
  thisWeek: number;
  byType: Array<{ type: string; count: number }>;
}

export interface UserGrowthPoint {
  date: string;
  newUsers: number;
  activeUsers: number;
}

export interface TaskCompletionPoint {
  date: string;
  completions: number;
}

export interface PlatformDistribution {
  byUsmleStage: Array<{ stage: string; count: number }>;
  byAcademicYear: Array<{ year: string; count: number }>;
  plansByStatus: Array<{ status: string; count: number }>;
}