import type {
  OverallProgress,
  ConsistencyAnalytics,
  WeeklyActivityData,
  SystemProgressItem,
  MilestoneAnalyticsItem,
  PlanHealthAnalytics,
  PlanHealthStatus,
  RescheduleEntry,
  AIUsageAnalytics,
} from "./types";
import { MILESTONE_AT_RISK_DAYS } from "./constants";

// ─── Internal row types (match Prisma select shapes) ───

interface TaskRow {
  status: string;
  isOptional: boolean;
  scheduledDate: string | null;
  completedAt: string | null;
  milestoneId: string;
  chapter: {
    system: { name: string; slug: string } | null;
  } | null;
  resource: {
    system: { name: string; slug: string } | null;
  } | null;
}

interface MilestoneRow {
  id: string;
  title: string;
  startDate: string | null;
  targetEndDate: string | null;
  status: string;
  order: number;
  system: { name: string; slug: string } | null;
}

interface RescheduleRow {
  createdAt: string;
  trigger: string;
  daysBehind: number;
  tasksMoved: number;
  oldEndDate: string | null;
  newEndDate: string | null;
}

interface AIRecRow {
  type: string;
  createdAt: string;
  summary: string;
}

// ─── Helpers ───

function toDateOnly(iso: string): string {
  return iso.split("T")[0];
}

function todayDateOnly(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

// ─── Overall Progress ───

export function calculateOverallProgress(
  tasks: TaskRow[],
  milestones: MilestoneRow[],
  plan: { startDate: string | null; endDate: string | null; targetExamDate: string | null }
): OverallProgress {
  const required = tasks.filter((t) => !t.isOptional);
  const completed = required.filter((t) => t.status === "COMPLETED");
  const total = required.length;
  const done = completed.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const currentMilestone =
    milestones.find((m) => m.status !== "COMPLETED")?.title ?? null;

  const completedMilestones = milestones.filter(
    (m) => m.status === "COMPLETED"
  ).length;

  let projectedEndDate: string | null = null;
  let daysDifference: number | null = null;

  if (plan.startDate && plan.endDate && pct > 0 && pct < 100) {
    const startMs = new Date(plan.startDate).getTime();
    const endMs = new Date(plan.endDate).getTime();
    const elapsed = Date.now() - startMs;
    const daysPerPct = elapsed / pct;
    const remainingDays = daysPerPct * (100 - pct);
    const projected = new Date(Date.now() + remainingDays * 86400000);
    projectedEndDate = projected.toISOString();
    daysDifference = Math.round((endMs - projected.getTime()) / 86400000);
  }

  return {
    totalRequiredTasks: total,
    completedRequiredTasks: done,
    remainingRequiredTasks: total - done,
    completionPercentage: pct,
    currentMilestone,
    completedMilestones,
    totalMilestones: milestones.length,
    planStartDate: plan.startDate,
    expectedEndDate: plan.endDate,
    projectedEndDate,
    daysDifference,
  };
}

// ─── Consistency ───

export function calculateConsistency(
  tasks: TaskRow[],
  planStartDate: string | null
): ConsistencyAnalytics {
  const requiredDone = tasks.filter(
    (t) => !t.isOptional && t.status === "COMPLETED" && t.completedAt
  );

  if (requiredDone.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      activeStudyDays: 0,
      inactiveDays: 0,
      completionRate: 0,
      avgTasksPerActiveDay: 0,
    };
  }

  const dateSet = new Set<string>();
  const tasksByDate = new Map<string, number>();

  for (const t of requiredDone) {
    const d = toDateOnly(t.completedAt!);
    dateSet.add(d);
    tasksByDate.set(d, (tasksByDate.get(d) ?? 0) + 1);
  }

  const sorted = [...dateSet].sort();
  const activeDays = sorted.length;

  let longest = 1;
  let streak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const diff =
      (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) /
      86400000;
    if (diff === 1) {
      streak++;
      longest = Math.max(longest, streak);
    } else {
      streak = 1;
    }
  }
  longest = Math.max(longest, streak);

  const today = todayDateOnly();
  const lastActive = sorted[sorted.length - 1];
  const gap = Math.round(
    (new Date(today).getTime() - new Date(lastActive).getTime()) / 86400000
  );
  const currentStreak = gap <= 1 ? streak : 0;

  let inactiveDays = 0;
  if (planStartDate) {
    const start = new Date(planStartDate);
    start.setHours(0, 0, 0, 0);
    const totalDays =
      Math.max(
        Math.round((new Date(today).getTime() - start.getTime()) / 86400000),
        0
      ) + 1;
    inactiveDays = Math.max(totalDays - activeDays, 0);
  }

  const allRequired = tasks.filter((t) => !t.isOptional);
  const completionRate =
    allRequired.length > 0
      ? Math.round((requiredDone.length / allRequired.length) * 100)
      : 0;

  const avgTasks =
    activeDays > 0
      ? Math.round((requiredDone.length / activeDays) * 10) / 10
      : 0;

  return {
    currentStreak,
    longestStreak: longest,
    activeStudyDays: activeDays,
    inactiveDays,
    completionRate,
    avgTasksPerActiveDay: avgTasks,
  };
}

// ─── Weekly Activity ───

export function calculateWeeklyActivity(
  tasks: TaskRow[]
): WeeklyActivityData {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daily: WeeklyActivityData["daily"] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = toDateOnly(d.toISOString());

    const scheduled = tasks.filter(
      (t) => !t.isOptional && t.scheduledDate && toDateOnly(t.scheduledDate) === dateStr
    ).length;

    const completed = tasks.filter(
      (t) =>
        !t.isOptional &&
        t.status === "COMPLETED" &&
        t.completedAt &&
        toDateOnly(t.completedAt) === dateStr
    ).length;

    daily.push({
      date: dateStr,
      completedRequired: completed,
      scheduledRequired: scheduled,
      completionPercentage:
        scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
    });
  }

  // Last 4 weeks summary
  const fourWeeksAgo = new Date(today);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const fourWeekCompleted = tasks.filter(
    (t) =>
      !t.isOptional &&
      t.status === "COMPLETED" &&
      t.completedAt &&
      new Date(t.completedAt) >= fourWeeksAgo
  );

  const fourWeekScheduled = tasks.filter(
    (t) =>
      !t.isOptional &&
      t.scheduledDate &&
      new Date(t.scheduledDate) >= fourWeeksAgo &&
      new Date(t.scheduledDate) <= today
  );

  const dayCounts = new Map<string, number>();
  for (const t of fourWeekCompleted) {
    const d = toDateOnly(t.completedAt!);
    dayCounts.set(d, (dayCounts.get(d) ?? 0) + 1);
  }

  let bestDay: string | null = null;
  let worstDay: string | null = null;
  let bestCount = -1;
  let worstCount = Infinity;

  for (const [d, c] of dayCounts) {
    if (c > bestCount) {
      bestCount = c;
      bestDay = d;
    }
    if (c < worstCount) {
      worstCount = c;
      worstDay = d;
    }
  }

  return {
    daily,
    weeklySummary: {
      totalCompleted: fourWeekCompleted.length,
      totalScheduled: fourWeekScheduled.length,
      avgDailyCompletion:
        28 > 0 ? Math.round((fourWeekCompleted.length / 28) * 10) / 10 : 0,
      bestDay,
      worstDay,
    },
  };
}

// ─── System Progress ───

export function calculateSystemProgress(
  tasks: TaskRow[]
): SystemProgressItem[] {
  const map = new Map<
    string,
    { name: string; slug: string; total: number; done: number }
  >();

  for (const t of tasks) {
    if (t.isOptional) continue;
    const sys = t.chapter?.system ?? t.resource?.system ?? null;
    if (!sys) continue;

    const e = map.get(sys.slug);
    if (e) {
      e.total++;
      if (t.status === "COMPLETED") e.done++;
    } else {
      map.set(sys.slug, {
        name: sys.name,
        slug: sys.slug,
        total: 1,
        done: t.status === "COMPLETED" ? 1 : 0,
      });
    }
  }

  return [...map.values()]
    .map((s) => ({
      systemId: s.slug,
      systemName: s.name,
      systemSlug: s.slug,
      totalRequired: s.total,
      completedRequired: s.done,
      percentage: s.total > 0 ? Math.round((s.done / s.total) * 100) : 0,
    }))
    .sort((a, b) => {
      const aStarted = a.completedRequired > 0 ? 0 : 1;
      const bStarted = b.completedRequired > 0 ? 0 : 1;
      if (aStarted !== bStarted) return aStarted - bStarted;
      return a.percentage - b.percentage;
    });
}

// ─── Milestone Analytics ───

export function calculateMilestoneAnalytics(
  tasks: TaskRow[],
  milestones: MilestoneRow[]
): MilestoneAnalyticsItem[] {
  const currentId = milestones.find((m) => m.status !== "COMPLETED")?.id;

  const byMilestone = new Map<string, TaskRow[]>();
  for (const t of tasks) {
    const arr = byMilestone.get(t.milestoneId) ?? [];
    arr.push(t);
    byMilestone.set(t.milestoneId, arr);
  }

  const now = new Date();

  return milestones.map((m) => {
    const mt = byMilestone.get(m.id) ?? [];
    const req = mt.filter((t) => !t.isOptional);
    const done = req.filter((t) => t.status === "COMPLETED");
    const pct = req.length > 0 ? Math.round((done.length / req.length) * 100) : 0;

    let isAtRisk = false;
    if (m.targetEndDate && m.status !== "COMPLETED") {
      const daysLeft = Math.round(
        (new Date(m.targetEndDate).getTime() - now.getTime()) / 86400000
      );
      if (daysLeft <= MILESTONE_AT_RISK_DAYS && daysLeft > 0 && pct < 50) {
        isAtRisk = true;
      }
    }

    return {
      id: m.id,
      title: m.title,
      startDate: m.startDate,
      targetEndDate: m.targetEndDate,
      requiredTaskCount: req.length,
      completedTaskCount: done.length,
      progressPercentage: pct,
      status: m.status,
      isCurrent: currentId === m.id,
      isAtRisk,
      order: m.order,
    };
  });
}

// ─── Plan Health ───

export function calculatePlanHealth(
  tasks: TaskRow[],
  plan: { startDate: string | null; endDate: string | null; status: string }
): PlanHealthAnalytics {
  if (plan.status === "COMPLETED") {
    return {
      status: "COMPLETED",
      expectedProgress: 100,
      actualProgress: 100,
      difference: 0,
      daysBehind: 0,
      overdueTaskCount: 0,
      remainingTasks: 0,
    };
  }

  const required = tasks.filter((t) => !t.isOptional);
  const done = required.filter((t) => t.status === "COMPLETED");
  const actual = required.length > 0 ? (done.length / required.length) * 100 : 0;

  let expected = 0;
  let daysBehind = 0;

  if (plan.startDate && plan.endDate) {
    const startMs = new Date(plan.startDate).getTime();
    const endMs = new Date(plan.endDate).getTime();
    const totalMs = endMs - startMs;
    const elapsed = Date.now() - startMs;

    if (totalMs > 0) {
      expected = Math.min(Math.max((elapsed / totalMs) * 100, 0), 100);
      const dailyRate = 100 / (totalMs / 86400000);
      const diff = actual - expected;

      if (diff < 0) {
        daysBehind = Math.round(Math.abs(diff) / dailyRate);
      } else {
        daysBehind = -Math.round(diff / dailyRate);
      }
    }
  }

  const difference = Math.round(actual - expected);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTaskCount = required.filter(
    (t) =>
      t.status !== "COMPLETED" &&
      t.status !== "SKIPPED" &&
      t.scheduledDate &&
      new Date(t.scheduledDate) < today
  ).length;

  const remainingTasks = required.filter(
    (t) => t.status !== "COMPLETED" && t.status !== "SKIPPED"
  ).length;

  let status: PlanHealthStatus;
  if (difference >= -5) status = "ON_TRACK";
  else if (difference >= -15) status = "AT_RISK";
  else if (difference >= -30) status = "BEHIND";
  else status = "CRITICAL";

  return {
    status,
    expectedProgress: Math.round(expected),
    actualProgress: Math.round(actual),
    difference,
    daysBehind: Math.abs(daysBehind),
    overdueTaskCount,
    remainingTasks,
  };
}

// ─── Reschedule Analytics ───

export function calculateRescheduleAnalytics(
  reschedules: RescheduleRow[]
): RescheduleEntry[] {
  return reschedules.map((r) => {
    let daysShifted = 0;
    if (r.oldEndDate && r.newEndDate) {
      daysShifted = Math.round(
        (new Date(r.newEndDate).getTime() -
          new Date(r.oldEndDate).getTime()) /
          86400000
      );
    }
    return {
      date: r.createdAt,
      trigger: r.trigger,
      tasksMoved: r.tasksMoved,
      daysShifted,
      oldEndDate: r.oldEndDate,
      newEndDate: r.newEndDate,
    };
  });
}

// ─── AI Usage Analytics ───

export function calculateAIUsage(
  recs: AIRecRow[]
): AIUsageAnalytics {
  const today = todayDateOnly();
  const dailyCount = recs.filter(
    (r) => toDateOnly(r.createdAt) === today
  ).length;

  const planReviews = recs.filter((r) => r.type === "PLAN_REVIEW").length;
  const rescheduleRecs = recs.filter((r) => r.type === "RESCHEDULE").length;
  const capacityRecs = recs.filter((r) => r.type === "CAPACITY").length;
  const otherCount =
    recs.length - planReviews - rescheduleRecs - capacityRecs;

  return {
    total: recs.length,
    dailyCount,
    planReviews,
    rescheduleRecommendations: rescheduleRecs,
    capacityRecommendations: capacityRecs,
    otherCount,
    lastRecommendationDate: recs.length > 0 ? recs[0].createdAt : null,
    recent: recs.slice(0, 10).map((r) => ({
      type: r.type,
      summary: r.summary,
      date: r.createdAt,
    })),
  };
}