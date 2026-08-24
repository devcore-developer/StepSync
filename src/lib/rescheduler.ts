import { RESCHEDULING_CONFIG } from "./constants/rescheduling";
import { DRIFT_STATUS } from "./constants/drift";

// ─── Types ──────────────────────────────────────────────

export interface RescheduleTask {
  id: string;
  title: string;
  status: string;
  isOptional: boolean;
  scheduledDate: Date | string;
  originalScheduledDate: Date | string;
  estimatedDuration: number | null; // minutes
  order: number;
  milestoneId: string;
  milestoneOrder: number;
}

export interface RescheduleInput {
  today: Date;
  planStartDate: Date | string | null;
  planEndDate: Date | string | null;
  tasks: RescheduleTask[];
  dailyCapacityHours?: number;
  defaultTaskDurationMinutes?: number;
}

export interface TaskChange {
  taskId: string;
  taskTitle: string;
  oldScheduledDate: string;
  newScheduledDate: string;
  isOptional: boolean;
}

export interface OverloadedDay {
  date: string;
  hours: number;
  capacity: number;
}

export interface RescheduleResult {
  needsReschedule: boolean;
  reason?: string;
  proposedChanges: TaskChange[];
  tasksMoved: number;
  requiredTasksMoved: number;
  optionalTasksMoved: number;
  daysShifted: number;
  canFitWithinCurrentEndDate: boolean;
  projectedEndDate: string | null;
  originalProjectedEndDate: string | null;
  overloadedDays: OverloadedDay[];
  summary: string;
}

interface DailySlot {
  date: Date;
  capacityHours: number;
  usedHours: number;
  taskIds: string[];
}

// ─── Date Helpers ───────────────────────────────────────

function toCalendarDate(date: Date | string): Date {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}


function toDateKey(date: Date | string): string {
  return toISODateString(date).split("T")[0];
}

function isBeforeDay(a: Date | string, b: Date | string): boolean {
  return toCalendarDate(a).getTime() < toCalendarDate(b).getTime();
}

function isSameDay(a: Date | string, b: Date | string): boolean {
  return toCalendarDate(a).getTime() === toCalendarDate(b).getTime();
}

function addDays(date: Date | string, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return toCalendarDate(result);
}

function toISODateString(date: Date | string): string {
  return toCalendarDate(date).toISOString();
}

function daysBetween(a: Date | string, b: Date | string): number {
  const ca = toCalendarDate(a);
  const cb = toCalendarDate(b);
  const msPerDay = 86400000;
  return Math.round(Math.abs(cb.getTime() - ca.getTime()) / msPerDay);
}

// ─── Task Helpers ───────────────────────────────────────

function getTaskDurationHours(
  task: RescheduleTask,
  defaultMinutes: number
): number {
  return (task.estimatedDuration ?? defaultMinutes) / 60;
}

function isEligibleForReschedule(task: RescheduleTask): boolean {
  return (
    task.status !== "COMPLETED" &&
    task.status !== "SKIPPED" &&
    task.scheduledDate !== null
  );
}

function isOverdue(task: RescheduleTask, today: Date): boolean {
  return isBeforeDay(task.scheduledDate, today);
}

function sortTasksByOriginalOrder(tasks: RescheduleTask[]): RescheduleTask[] {
  return [...tasks].sort((a, b) => {
    // First by milestone order
    if (a.milestoneOrder !== b.milestoneOrder) {
      return a.milestoneOrder - b.milestoneOrder;
    }
    // Then by original scheduled date
    const dateA = new Date(a.originalScheduledDate).getTime();
    const dateB = new Date(b.originalScheduledDate).getTime();
    if (dateA !== dateB) return dateA - dateB;
    // Then by task order
    return a.order - b.order;
  });
}

// ─── Main Algorithm ────────────────────────────────────

export function calculateReschedule(input: RescheduleInput): RescheduleResult {
  const {
    today: rawToday,
    planEndDate,
    tasks,
    dailyCapacityHours = RESCHEDULING_CONFIG.DEFAULT_DAILY_STUDY_HOURS,
    defaultTaskDurationMinutes = RESCHEDULING_CONFIG.DEFAULT_TASK_DURATION_MINUTES,
  } = input;

  const today = toCalendarDate(rawToday);

  // 1. Get eligible incomplete tasks
  const eligibleTasks = tasks.filter(isEligibleForReschedule);

  if (eligibleTasks.length === 0) {
    return {
      needsReschedule: false,
      reason: "لا توجد مهام غير مكتملة لإعادة جدولتها.",
      proposedChanges: [],
      tasksMoved: 0,
      requiredTasksMoved: 0,
      optionalTasksMoved: 0,
      daysShifted: 0,
      canFitWithinCurrentEndDate: true,
      projectedEndDate: null,
      originalProjectedEndDate: null,
      overloadedDays: [],
      summary: "",
    };
  }

  // 2. Check for overdue tasks
  const overdueTasks = eligibleTasks.filter((t) => isOverdue(t, today));

  if (overdueTasks.length === 0) {
    return {
      needsReschedule: false,
      reason: "لا توجد مهام متأخرة. أنت على المسار الصحيح.",
      proposedChanges: [],
      tasksMoved: 0,
      requiredTasksMoved: 0,
      optionalTasksMoved: 0,
      daysShifted: 0,
      canFitWithinCurrentEndDate: true,
      projectedEndDate: null,
      originalProjectedEndDate: null,
      overloadedDays: [],
      summary: "",
    };
  }

  // 3. Sort by original order (milestone → date → order)
  const requiredTasks = sortTasksByOriginalOrder(
    eligibleTasks.filter((t) => !t.isOptional)
  );
  const optionalTasks = sortTasksByOriginalOrder(
    eligibleTasks.filter((t) => t.isOptional)
  );

  // 4. Build daily slots
  const maxDays = RESCHEDULING_CONFIG.MAX_SCHEDULE_DAYS;
  const slots: DailySlot[] = [];
  for (let i = 0; i < maxDays; i++) {
    slots.push({
      date: addDays(today, i),
      capacityHours: dailyCapacityHours,
      usedHours: 0,
      taskIds: [],
    });
  }

  // 5. Place tasks
  const changes: TaskChange[] = [];
  let lastPlacedSlotIndex = 0;

  function placeTasks(tasks: RescheduleTask[], isOptional: boolean): void {
    let slotIndex = 0;

    for (const task of tasks) {
      const durationHours = getTaskDurationHours(task, defaultTaskDurationMinutes);

      // Find slot with enough capacity
      while (slotIndex < slots.length) {
        const slot = slots[slotIndex];
        const remaining = slot.capacityHours - slot.usedHours;

        if (remaining > 0 || durationHours <= slot.capacityHours) {
          // Place task here (even if slightly over capacity for long tasks)
          slot.usedHours += durationHours;
          slot.taskIds.push(task.id);

          const newDate = slot.date;
          const oldDate = toCalendarDate(task.scheduledDate);

          if (!isSameDay(oldDate, newDate)) {
            changes.push({
              taskId: task.id,
              taskTitle: task.title,
              oldScheduledDate: toISODateString(oldDate),
              newScheduledDate: toISODateString(newDate),
              isOptional,
            });
          }

          if (slotIndex > lastPlacedSlotIndex) {
            lastPlacedSlotIndex = slotIndex;
          }

          break;
        }

        slotIndex++;
      }
    }
  }

  // Place required tasks first
  placeTasks(requiredTasks, false);
  // Then optional tasks
  placeTasks(optionalTasks, true);

  // 6. Calculate results
  const requiredChanges = changes.filter((c) => !c.isOptional);
  const optionalChanges = changes.filter((c) => c.isOptional);

  // Find projected end date
  const lastSlotWithTask = [...slots].reverse().find((s) => s.taskIds.length > 0);
  const projectedEndDate = lastSlotWithTask
    ? toISODateString(lastSlotWithTask.date)
    : null;

  // Find original projected end date (latest scheduledDate among eligible tasks)
  const sortedByScheduled = [...eligibleTasks].sort(
    (a, b) =>
      new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
  );
  const originalProjectedEndDate = sortedByScheduled[0]
    ? toISODateString(sortedByScheduled[0].scheduledDate)
    : null;

  // Check if fits within plan end date
  let canFitWithinCurrentEndDate = true;
  if (planEndDate && projectedEndDate) {
    canFitWithinCurrentEndDate = !isBeforeDay(planEndDate, projectedEndDate);
  }

  // Find overloaded days
  const overloadedDays: OverloadedDay[] = slots
    .filter((s) => s.taskIds.length > 0 && s.usedHours > s.capacityHours)
    .map((s) => ({
      date: toISODateString(s.date),
      hours: Math.round(s.usedHours * 100) / 100,
      capacity: s.capacityHours,
    }));

  // Calculate days shifted
  let daysShifted = 0;
  if (projectedEndDate && originalProjectedEndDate) {
    daysShifted = daysBetween(originalProjectedEndDate, projectedEndDate);
  }

  // Generate summary
  const summary = generateSummary(
    changes.length,
    daysShifted,
    originalProjectedEndDate,
    projectedEndDate,
    canFitWithinCurrentEndDate
  );

  return {
    needsReschedule: true,
    proposedChanges: changes,
    tasksMoved: changes.length,
    requiredTasksMoved: requiredChanges.length,
    optionalTasksMoved: optionalChanges.length,
    daysShifted,
    canFitWithinCurrentEndDate,
    projectedEndDate,
    originalProjectedEndDate,
    overloadedDays,
    summary,
  };
}

// ─── Summary Generator ─────────────────────────────────

function generateSummary(
  tasksMoved: number,
  daysShifted: number,
  originalEnd: string | null,
  newEnd: string | null,
  canFit: boolean
): string {
  const parts: string[] = [];

  parts.push(`سيتم إعادة جدولة ${tasksMoved} مهمة.`);

  if (daysShifted > 0) {
    parts.push(`الجدول سيتأخر ${daysShifted} ${daysShifted === 1 ? "يوم" : "أيام"}.`);
  }

  if (!canFit && originalEnd && newEnd) {
    parts.push(
      `تاريخ الانتهاء المتوقع سيتغير من ${formatDateArabic(originalEnd)} إلى ${formatDateArabic(newEnd)}.`
    );
  }

  return parts.join(" ");
}

function formatDateArabic(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Preview Helper ────────────────────────────────────

export function formatChangesForPreview(
  changes: TaskChange[]
): { moved: TaskChange[]; unchanged: number } {
  return {
    moved: changes,
    unchanged: 0, // We don't track unchanged tasks in the result
  };
}