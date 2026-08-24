export interface TaskLike {
  id: string;
  status: string;
  isOptional?: boolean;
  chapter?: {
    id: string;          // ← أضف هذا السطر
    systemId?: string;
    system?: { id: string; name: string } | null;
  } | null;
  resource?: {
    systemId?: string;
    system?: { id: string; name: string } | null;
  } | null;
  completedAt?: Date | string | null;
}

export interface MilestoneLike {
  id: string;
  title: string;
  system?: { id: string; name: string } | null;
  tasks: TaskLike[];
}

export interface SystemProgress {
  systemId: string;
  systemName: string;
  total: number;
  completed: number;
  percentage: number;
}

export interface PlanProgress {
  total: number;
  completed: number;
  percentage: number;
  bySystem: SystemProgress[];
}

export function getPlanProgress(milestones: MilestoneLike[]): PlanProgress {
  let total = 0;
  let completed = 0;
  const systemMap = new Map<string, SystemProgress>();

  for (const milestone of milestones) {
    for (const task of milestone.tasks) {
      if (task.isOptional) continue;

      total++;
      if (task.status === "completed") {
        completed++;
      }

      const system =
        task.chapter?.system || task.resource?.system || milestone.system;

      if (system) {
        const existing = systemMap.get(system.id);
        if (existing) {
          existing.total++;
          if (task.status === "completed") existing.completed++;
          existing.percentage = Math.round(
            (existing.completed / existing.total) * 100
          );
        } else {
          const isComp = task.status === "completed" ? 1 : 0;
          systemMap.set(system.id, {
            systemId: system.id,
            systemName: system.name,
            total: 1,
            completed: isComp,
            percentage: isComp * 100,
          });
        }
      }
    }
  }

  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    bySystem: Array.from(systemMap.values()),
  };
}

export function calculatePlanProgress(tasks: TaskLike[]): {
  total: number;
  completed: number;
  percentage: number;
} {
  const required = tasks.filter((t) => !t.isOptional);
  const total = required.length;
  const completed = required.filter((t) => t.status === "completed").length;
  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

// ═══════════════════════════════════════════════════
//  ← الدوال الجديدة هنا بالظبط
// ═══════════════════════════════════════════════════

export function getChapterProgress(
  milestones: MilestoneLike[],
  chapterId: string
): { total: number; completed: number; percentage: number } {
  const chapterTasks: TaskLike[] = [];

  for (const milestone of milestones) {
    for (const task of milestone.tasks) {
      if (task.chapter && task.chapter.id === chapterId) {
        chapterTasks.push(task);
      }
    }
  }

  const required = chapterTasks.filter((t) => !t.isOptional);
  const total = required.length;
  const completed = required.filter((t) => t.status === "completed").length;
  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function getTodayTasks(milestones: MilestoneLike[]): TaskLike[] {
  const allTasks: TaskLike[] = [];
  for (const milestone of milestones) {
    for (const task of milestone.tasks) {
      if (!task.isOptional) {
        allTasks.push(task);
      }
    }
  }

  return allTasks.filter((t) => t.status !== "completed");
}

export function getLatestCompletionDate(
  milestones: MilestoneLike[]
): string | null {
  let latest: Date | null = null;

  for (const milestone of milestones) {
    for (const task of milestone.tasks) {
      if (task.status === "completed" && task.completedAt) {
        const d = new Date(task.completedAt);
        if (!latest || d > latest) {
          latest = d;
        }
      }
    }
  }

  return latest ? latest.toISOString() : null;
}

export function isPlanCompleted(milestones: MilestoneLike[]): boolean {
  for (const milestone of milestones) {
    for (const task of milestone.tasks) {
      if (!task.isOptional && task.status !== "completed") {
        return false;
      }
    }
  }
  return true;
}