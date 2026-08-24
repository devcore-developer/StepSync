import type {
  PlatformAnalytics,
  UserGrowthPoint,
  PlatformDistribution,
} from "./types";

function fillDateGaps(
  data: Array<{ date: string; count: number }>,
  startDate: Date,
  endDate: Date
): Array<{ date: string; count: number }> {
  const map = new Map(data.map((d) => [d.date.split("T")[0], d.count]));
  const result: Array<{ date: string; count: number }> = [];
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (cur <= end) {
    const ds = cur.toISOString().split("T")[0];
    result.push({ date: ds, count: map.get(ds) ?? 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

export function buildPlatformAnalytics(
  range: string,
  d: {
    totalUsers: number;
    newUsersWeek: number;
    newUsersMonth: number;
    newInPeriod: number;
    onboardedCount: number;
    totalPlans: number;
    activePlans: number;
    completedPlans: number;
    behindPlans: number;
    atRiskPlans: number;
    usersActive7d: number;
    usersActive30d: number;
    avgTasksPerActiveUser: number;
    avgPlanProgress: number;
    taskCompletions7d: number;
    totalPartners: number;
    pendingRequests: number;
    activeGroups: number;
    totalGroupMembers: number;
    totalConversations: number;
    totalMessages: number;
    messagesWeek: number;
    activeConversations: number;
    totalNotifications: number;
    unreadNotifications: number;
    notificationsWeek: number;
    totalAI: number;
    aiWeek: number;
    aiByType: Array<{ type: string; count: number }>;
    newUsersByDay: Array<{ date: string; count: number }>;
    activeUsersByDay: Array<{ date: string; count: number }>;
    taskCompletionsByDay: Array<{ date: string; count: number }>;
    usersByStage: Array<{ stage: string; count: number }>;
    usersByYear: Array<{ year: string; count: number }>;
    plansByStatus: Array<{ status: string; count: number }>;
    chartStartDate: Date;
    chartEndDate: Date;
  }
): PlatformAnalytics {
  // Fill gaps in time-series data
  const newUsersFilled = fillDateGaps(
    d.newUsersByDay,
    d.chartStartDate,
    d.chartEndDate
  );
  const activeUsersFilled = fillDateGaps(
    d.activeUsersByDay,
    d.chartStartDate,
    d.chartEndDate
  );
  const tasksFilled = fillDateGaps(
    d.taskCompletionsByDay,
    d.chartStartDate,
    d.chartEndDate
  );

  // Merge user growth
  const newUserMap = new Map(
    newUsersFilled.map((x) => [x.date, x.count])
  );
  const activeUserMap = new Map(
    activeUsersFilled.map((x) => [x.date, x.count])
  );
  const allDates = new Set([
    ...newUserMap.keys(),
    ...activeUserMap.keys(),
  ]);

  const userGrowth: UserGrowthPoint[] = [...allDates]
    .sort()
    .map((date) => ({
      date,
      newUsers: newUserMap.get(date) ?? 0,
      activeUsers: activeUserMap.get(date) ?? 0,
    }));

  // Distribution
  const distribution: PlatformDistribution = {
    byUsmleStage: d.usersByStage,
    byAcademicYear: d.usersByYear,
    plansByStatus: d.plansByStatus,
  };

  return {
    range,
    users: {
      total: d.totalUsers,
      newThisWeek: d.newUsersWeek,
      newThisMonth: d.newUsersMonth,
      newInPeriod: d.newInPeriod,
      onboarded: d.onboardedCount,
      onboardingRate:
        d.totalUsers > 0
          ? Math.round((d.onboardedCount / d.totalUsers) * 100)
          : 0,
    },
    studyPlans: {
      total: d.totalPlans,
      active: d.activePlans,
      completed: d.completedPlans,
      behind: d.behindPlans,
      atRisk: d.atRiskPlans,
    },
    engagement: {
      usersActive7d: d.usersActive7d,
      usersActive30d: d.usersActive30d,
      avgTasksPerActiveUser:
        Math.round(d.avgTasksPerActiveUser * 10) / 10,
      avgPlanProgress: Math.round(d.avgPlanProgress * 10) / 10,
      taskCompletions7d: d.taskCompletions7d,
    },
    social: {
      totalPartners: d.totalPartners,
      pendingRequests: d.pendingRequests,
      activeGroups: d.activeGroups,
      totalGroupMembers: d.totalGroupMembers,
      totalConversations: d.totalConversations,
    },
    messaging: {
      totalMessages: d.totalMessages,
      messagesThisWeek: d.messagesWeek,
      activeConversations: d.activeConversations,
    },
    notifications: {
      total: d.totalNotifications,
      unread: d.unreadNotifications,
      createdThisWeek: d.notificationsWeek,
    },
    ai: {
      total: d.totalAI,
      thisWeek: d.aiWeek,
      byType: d.aiByType,
    },
    userGrowth,
    taskCompletions: tasksFilled.map((x) => ({
      date: x.date,
      completions: x.count,
    })),
    distribution,
  };
}