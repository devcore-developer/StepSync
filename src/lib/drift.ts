import { DRIFT_THRESHOLDS, type DriftStatus } from "./constants/drift";

// ─── Types ──────────────────────────────────────────────

export interface DriftTaskInput {
  id: string;
  title: string;
  status: string;
  isOptional: boolean;
  scheduledDate: Date | string | null;
  completedAt: Date | string | null;
  order: number;
  milestoneId: string;
  milestoneTitle: string;
  systemName?: string | null;
  chapterName?: string | null;
  resourceName?: string | null;
}

export interface DriftPlanInput {
  status: string;
  startDate: Date | string | null;
  tasks: DriftTaskInput[];
}

export interface OverdueTask {
  id: string;
  title: string;
  scheduledDate: string;
  daysOverdue: number;
  milestoneId: string;
  milestoneTitle: string;
  systemName: string | null;
  chapterName: string | null;
  resourceName: string | null;
  isOptional: boolean;
  status: string;
}

export interface NextTask {
  id: string;
  title: string;
  scheduledDate: string;
  type: "today" | "overdue" | "upcoming";
  milestoneTitle: string;
}

export interface LastCompletedTask {
  id: string;
  title: string;
  completedAt: string;
  milestoneTitle: string;
}

export interface DriftResult {
  status: DriftStatus;
  daysBehind: number;
  expectedProgress: number;
  actualProgress: number;
  progressDifference: number;
  overdueTaskCount: number;
  overdueTasks: OverdueTask[];
  nextTask: NextTask | null;
  lastCompletedTask: LastCompletedTask | null;
  completedRequiredCount: number;
  remainingRequiredCount: number;
  totalRequiredCount: number;
}

// ─── Date Helpers ───────────────────────────────────────

function toCalendarDate(date: Date | string): Date {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getTodayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function calendarDaysBetween(a: Date | string, b: Date | string): number {
  const ca = toCalendarDate(a);
  const cb = toCalendarDate(b);
  const msPerDay = 86400000;
  return Math.round(Math.abs(cb.getTime() - ca.getTime()) / msPerDay);
}

function isBeforeDay(a: Date, b: Date): boolean {
  return toCalendarDate(a).getTime() < toCalendarDate(b).getTime();
}

function isSameDay(a: Date, b: Date): boolean {
  return toCalendarDate(a).getTime() === toCalendarDate(b).getTime();
}

function toISODateSafe(date: Date | string | null): string | null {
  if (!date) return null;
  try {
    return new Date(date).toISOString();
  } catch {
    return null;
  }
}

// ─── Core Calculations ──────────────────────────────────

function getOverdueTasks(
  tasks: DriftTaskInput[],
  today: Date
): OverdueTask[] {
  return tasks
    .filter((task) => {
      if (task.isOptional) return false;
      if (task.status === "COMPLETED" || task.status === "SKIPPED") return false;
      if (!task.scheduledDate) return false;
      return isBeforeDay(toCalendarDate(task.scheduledDate), today);
    })
    .map((task) => ({
    id: task.id,
    title: task.title,
    scheduledDate: toISODateSafe(task.scheduledDate)!,
    daysOverdue: calendarDaysBetween(task.scheduledDate!, today),  // ← أضف !
    milestoneId: task.milestoneId,
    milestoneTitle: task.milestoneTitle,
    systemName: task.systemName ?? null,
    chapterName: task.chapterName ?? null,
    resourceName: task.resourceName ?? null,
    isOptional: task.isOptional,
    status: task.status,
    }))
    .sort((a, b) => {
      const dateA = new Date(a.scheduledDate).getTime();
      const dateB = new Date(b.scheduledDate).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return 0;
    });
}

function calculateDaysBehind(overdueTasks: OverdueTask[]): number {
  if (overdueTasks.length === 0) return 0;
  return overdueTasks[0].daysOverdue;
}

function calculateExpectedProgress(
  tasks: DriftTaskInput[],
  today: Date
): number {
  const required = tasks.filter((t) => !t.isOptional);
  if (required.length === 0) return 0;

  const scheduled = required.filter((t) => {
    if (!t.scheduledDate) return false;
    return !isBeforeDay(today, toCalendarDate(t.scheduledDate));
  });

  return Math.round((scheduled.length / required.length) * 100);
}

function calculateActualProgress(tasks: DriftTaskInput[]): number {
  const required = tasks.filter((t) => !t.isOptional);
  if (required.length === 0) return 0;

  const completed = required.filter((t) => t.status === "COMPLETED").length;
  return Math.round((completed / required.length) * 100);
}

function determineStatus(
  planStatus: string,
  daysBehind: number
): DriftStatus {
  if (planStatus === "COMPLETED") return "COMPLETED";
  if (daysBehind >= DRIFT_THRESHOLDS.CRITICAL_MIN_DAYS) return "CRITICAL";
  if (daysBehind >= DRIFT_THRESHOLDS.BEHIND_MIN_DAYS) return "BEHIND";
  if (daysBehind >= DRIFT_THRESHOLDS.AT_RISK_MIN_DAYS) return "AT_RISK";
  return "ON_TRACK";
}

function findNextTask(
  tasks: DriftTaskInput[],
  today: Date
): NextTask | null {
  const requiredIncomplete = tasks.filter(
    (t) =>
      !t.isOptional &&
      t.status !== "COMPLETED" &&
      t.status !== "SKIPPED" &&
      t.scheduledDate
  );

  // Priority 1: Today
  const todayTask = requiredIncomplete.find((t) =>
    isSameDay(toCalendarDate(t.scheduledDate!), today)
  );
  if (todayTask) {
    return {
      id: todayTask.id,
      title: todayTask.title,
      scheduledDate: toISODateSafe(todayTask.scheduledDate)!,
      type: "today",
      milestoneTitle: todayTask.milestoneTitle,
    };
  }

  // Priority 2: Oldest overdue
  const overdue = requiredIncomplete
    .filter((t) => isBeforeDay(toCalendarDate(t.scheduledDate!), today))
    .sort(
      (a, b) =>
        new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime()
    );
  if (overdue.length > 0) {
    return {
      id: overdue[0].id,
      title: overdue[0].title,
      scheduledDate: toISODateSafe(overdue[0].scheduledDate)!,
      type: "overdue",
      milestoneTitle: overdue[0].milestoneTitle,
    };
  }

  // Priority 3: Next upcoming
  const upcoming = requiredIncomplete
    .filter((t) => !isBeforeDay(toCalendarDate(t.scheduledDate!), today))
    .sort(
      (a, b) =>
        new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime()
    );
  if (upcoming.length > 0) {
    return {
      id: upcoming[0].id,
      title: upcoming[0].title,
      scheduledDate: toISODateSafe(upcoming[0].scheduledDate)!,
      type: "upcoming",
      milestoneTitle: upcoming[0].milestoneTitle,
    };
  }

  return null;
}

function findLastCompletedTask(
  tasks: DriftTaskInput[]
): LastCompletedTask | null {
  const completed = tasks
    .filter((t) => t.status === "COMPLETED" && t.completedAt)
    .sort(
      (a, b) =>
        new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    );

  if (completed.length === 0) return null;

  return {
    id: completed[0].id,
    title: completed[0].title,
    completedAt: toISODateSafe(completed[0].completedAt)!,
    milestoneTitle: completed[0].milestoneTitle,
  };
}

// ─── Public: Today's Scheduled Tasks ────────────────────

export function getTodayScheduledTasks(
  tasks: DriftTaskInput[],
  today?: Date
): DriftTaskInput[] {
  const ref = today ?? getTodayDate();
  return tasks.filter((t) => {
    if (!t.scheduledDate) return false;
    return isSameDay(toCalendarDate(t.scheduledDate), ref);
  });
}

// ─── Main Entry Point ───────────────────────────────────

export function calculateDrift(plan: DriftPlanInput): DriftResult {
  const today = getTodayDate();
  const required = plan.tasks.filter((t) => !t.isOptional);
  const completedRequired = required.filter(
    (t) => t.status === "COMPLETED"
  ).length;

  // Completed plan
  if (plan.status === "COMPLETED") {
    return {
      status: "COMPLETED",
      daysBehind: 0,
      expectedProgress: 100,
      actualProgress: 100,
      progressDifference: 0,
      overdueTaskCount: 0,
      overdueTasks: [],
      nextTask: null,
      lastCompletedTask: findLastCompletedTask(plan.tasks),
      completedRequiredCount: completedRequired,
      remainingRequiredCount: 0,
      totalRequiredCount: required.length,
    };
  }

  // Plan not started yet
  if (plan.startDate && isBeforeDay(today, toCalendarDate(plan.startDate))) {
    return {
      status: "ON_TRACK",
      daysBehind: 0,
      expectedProgress: 0,
      actualProgress: 0,
      progressDifference: 0,
      overdueTaskCount: 0,
      overdueTasks: [],
      nextTask: null,
      lastCompletedTask: null,
      completedRequiredCount: 0,
      remainingRequiredCount: required.length,
      totalRequiredCount: required.length,
    };
  }

  // Normal calculation
  const overdueTasks = getOverdueTasks(plan.tasks, today);
  const daysBehind = calculateDaysBehind(overdueTasks);
  const expectedProgress = calculateExpectedProgress(plan.tasks, today);
  const actualProgress = calculateActualProgress(plan.tasks);
  const progressDifference = actualProgress - expectedProgress;
  const status = determineStatus(plan.status, daysBehind);

  return {
    status,
    daysBehind,
    expectedProgress,
    actualProgress,
    progressDifference,
    overdueTaskCount: overdueTasks.length,
    overdueTasks,
    nextTask: findNextTask(plan.tasks, today),
    lastCompletedTask: findLastCompletedTask(plan.tasks),
    completedRequiredCount: completedRequired,
    remainingRequiredCount: required.length - completedRequired,
    totalRequiredCount: required.length,
  };
}