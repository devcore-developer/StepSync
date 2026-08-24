"use client";

import { useState, useTransition, useMemo } from "react";
import {
  getPlanProgress,
  calculatePlanProgress,
  isPlanCompleted,
  getLatestCompletionDate,
} from "@/lib/progress";
import {
  calculateDrift,
  getTodayScheduledTasks,
  type DriftResult,
  type DriftPlanInput,
} from "@/lib/drift";
import type { SystemProgress } from "@/lib/progress";
import { completeTask, uncompleteTask } from "@/actions/student/study-plans";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import AccountabilityCard from "@/components/shared/accountability-card";
import ReschedulePreview from "@/components/shared/reschedule-preview";
import { getReschedulePreview, rescheduleStudyPlan } from "@/actions/student/study-plans";
import type { RescheduleResult } from "@/lib/rescheduler";
import AIStudyAssistant from "@/components/shared/ai-study-assistant";
import AIPlanReview from "@/components/shared/ai-plan-review";
// ─── Types ──────────────────────────────────────────────

interface PlanTask {
  id: string;
  title: string;
  type: "chapter" | "resource" | "other";
  status: string;
  isOptional: boolean;
  scheduledDate?: string | null;
  completedAt?: string | null;
  chapter?: {
    id: string;
    title: string;
    systemId?: string;
    system?: { id: string; name: string } | null;
  } | null;
  resource?: {
    id: string;
    name: string;
    type: string;
    url?: string | null;
    systemId?: string;
    system?: { id: string; name: string } | null;
  } | null;
}

interface MilestoneData {
  id: string;
  title: string;
  order: number;
  status?: string;
  system?: { id: string; name: string } | null;
  tasks: PlanTask[];
}

interface PlanData {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  startDate?: string | null;
  milestones: MilestoneData[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ─── Helpers ────────────────────────────────────────────

function planToDriftInput(plan: PlanData): DriftPlanInput {
  return {
    status: plan.status,
    startDate: plan.startDate ?? null,
    tasks: plan.milestones.flatMap((m) =>
      m.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        isOptional: t.isOptional,
        scheduledDate: t.scheduledDate ?? null,
        completedAt: t.completedAt ?? null,
        order: 0,
        milestoneId: m.id,
        milestoneTitle: m.title,
        systemName:
          t.chapter?.system?.name ??
          t.resource?.system?.name ??
          m.system?.name ??
          null,
        chapterName: t.chapter?.title ?? null,
        resourceName: t.resource?.name ?? null,
      }))
    ),
  };
}

function getTaskTitle(task: PlanTask): string {
  if (task.type === "chapter" && task.chapter?.title) return task.chapter.title;
  if (task.type === "resource" && task.resource?.name) return task.resource.name;
  return task.title;
}

function getTaskBadge(task: PlanTask) {
  switch (task.type) {
    case "chapter":
      return <Badge variant="secondary">فصل</Badge>;
    case "resource":
      return <Badge variant="outline">مصدر</Badge>;
    default:
      return <Badge variant="secondary">مهمة</Badge>;
  }
}

// ─── Component ──────────────────────────────────────────

export default function StudyPlanView({
  plan,
  drift: initialDrift,
}: {
  plan: PlanData;
  drift: DriftResult | null;
}) {
  const [milestones, setMilestones] = useState<MilestoneData[]>(plan.milestones);
  const [isPending, startTransition] = useTransition();

  const progress = getPlanProgress(milestones);
  const completed = isPlanCompleted(milestones);
  const completionDate = completed ? getLatestCompletionDate(milestones) : null;

  // Recalculate drift locally when tasks change
  const drift = useMemo<DriftResult | null>(() => {
    if (!initialDrift) return null;
    return calculateDrift(planToDriftInput({ ...plan, milestones }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestones, initialDrift]);

  const currentMilestone =
    milestones.find((m) => {
      const mp = calculatePlanProgress(m.tasks);
      return mp.percentage < 100;
    }) ?? milestones[0];

  const todayTasks = useMemo(() => {
    if (!drift) return [];
    const all = planToDriftInput({ ...plan, milestones });
    return getTodayScheduledTasks(all.tasks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestones]);

  const todayCompleted = todayTasks.filter((t) => t.status === "COMPLETED").length;

  const overdueTasks = drift?.overdueTasks ?? [];

  function handleToggle(taskId: string, isCurrentlyCompleted: boolean) {
    startTransition(async () => {
      try {
        const result = isCurrentlyCompleted
          ? await uncompleteTask(taskId)
          : await completeTask(taskId);

        setMilestones((prev) =>
          prev.map((m) => ({
            ...m,
            tasks: m.tasks.map((t) =>
              t.id === taskId
                ? { ...t, status: result.status, completedAt: result.completedAt }
                : t
            ),
          }))
        );

        toast.success(
          isCurrentlyCompleted ? "تم إلغاء إكمال المهمة" : "تم إكمال المهمة بنجاح"
        );
      } catch (err: any) {
        toast.error(err.message || "فشل تحديث المهمة");
      }
    });
  }

  if (milestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <h2 className="text-xl font-semibold">لا توجد مراحل بعد</h2>
        <p className="text-muted-foreground mt-2">خطة الدراسة لا تحتوي على مراحل</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Accountability Banner ── */}
      {drift && (drift.status !== "ON_TRACK" || drift.overdueTaskCount > 0) && drift.status !== "COMPLETED" && (
        <AccountabilityCard drift={drift} variant="banner" />
      )}

      {/* ── Completed Banner ── */}
      {completed && (
        <div className="rounded-lg border border-green-500/50 bg-green-50 dark:bg-green-950/30 p-6 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <h2 className="text-xl font-bold text-green-700 dark:text-green-400">تم إكمال الخطة!</h2>
          {completionDate && (
            <p className="text-sm text-green-600 dark:text-green-500 mt-1">
              تاريخ الإكمال:{" "}
              {new Date(completionDate).toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </div>
      )}

      {/* ── Progress Overview ── */}
      <Card>
        <CardHeader>
          <CardTitle>{plan.title}</CardTitle>
          {plan.description && <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">التقدم العام</span>
              <span className="text-sm text-muted-foreground">{progress.completed} / {progress.total} مهمة</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div className={`rounded-full h-3 transition-all duration-500 ${completed ? "bg-green-500" : "bg-primary"}`} style={{ width: `${progress.percentage}%` }} />
            </div>
            <p className="text-right text-sm font-medium">{progress.percentage}%</p>
          </div>
          {progress.bySystem.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold">التقدم حسب النظام</h3>
              {progress.bySystem.map((sys: SystemProgress) => (
                <div key={sys.systemId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{sys.systemName}</span>
                    <span className="text-muted-foreground">{sys.completed}/{sys.total}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className={`rounded-full h-2 transition-all duration-500 ${sys.percentage === 100 ? "bg-green-500" : "bg-primary"}`} style={{ width: `${sys.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Today's Study ── */}
      {!completed && todayTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">مهام اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              {todayCompleted} من {todayTasks.length} مكتملة
            </p>
            <ul className="space-y-2">
              {todayTasks.map((task) => {
                const isDone = task.status === "COMPLETED";
                const planTask = milestones
                  .flatMap((m) => m.tasks)
                  .find((t) => t.id === task.id);
                if (!planTask) return null;
                return (
                  <li key={task.id} className={`flex items-start gap-3 p-2 rounded-md ${isDone ? "opacity-60" : ""}`}>
                    <Checkbox checked={isDone} disabled={isPending} onCheckedChange={() => handleToggle(task.id, isDone)} className="mt-0.5" />
                    <div className="flex-1">
                      <span className={`text-sm ${isDone ? "line-through text-muted-foreground" : ""}`}>{getTaskTitle(planTask)}</span>
                      {planTask.isOptional && <span className="text-xs text-muted-foreground ml-2">(اختياري)</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
            {overdueTasks.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  أيضاً: {overdueTasks.length} مهمة متأخرة من أيام سابقة
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* ── AI Study Assistant ── */}
      {!completed && (
      <AIStudyAssistant />
      )}

      {/* ── AI Plan Review ── */}
      {!completed && (
      <div className="flex justify-end">
         <AIPlanReview />
      </div>
      )} 
      {/* ── Overdue Tasks ── */}
      {!completed && overdueTasks.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-950/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="text-orange-500">⚠</span>
              <CardTitle className="text-base text-orange-700 dark:text-orange-400">مهام متأخرة</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">مهام من أيام سابقة لم تكتمل بعد</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {overdueTasks.map((task) => {
                const planTask = milestones
                  .flatMap((m) => m.tasks)
                  .find((t) => t.id === task.id);
                if (!planTask) return null;
                return (
                  <li key={task.id} className="flex items-start gap-3 p-2 rounded-md bg-white/60 dark:bg-black/20">
                    <Checkbox checked={false} disabled={isPending} onCheckedChange={() => handleToggle(task.id, false)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{getTaskTitle(planTask)}</span>
                        {getTaskBadge(planTask)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>متأخرة {task.daysOverdue} أيام</span>
                        <span>{task.milestoneTitle}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── Current Milestone ── */}
      {currentMilestone && !completed && (
        <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500 hover:bg-blue-600">الحالي</Badge>
              <CardTitle className="text-lg">{currentMilestone.title}</CardTitle>
            </div>
            {currentMilestone.system && <p className="text-sm text-muted-foreground">النظام: {currentMilestone.system.name}</p>}
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {currentMilestone.tasks.map((task) => {
                const isDone = task.status === "COMPLETED";
                return (
                  <li key={task.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${isDone ? "bg-muted/50 border-muted" : "bg-background border-border"}`}>
                    <Checkbox checked={isDone} disabled={isPending} onCheckedChange={() => handleToggle(task.id, isDone)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium transition-all ${isDone ? "line-through text-muted-foreground" : ""}`}>{getTaskTitle(task)}</span>
                        {getTaskBadge(task)}
                        {task.isOptional && <Badge variant="outline" className="text-xs">اختياري</Badge>}
                      </div>
                      {task.resource?.url && !isDone && (
                        <a href={task.resource.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">فتح المصدر ←</a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── All Milestones Timeline ── */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">جميع المراحل</h2>
        {milestones.map((milestone) => {
          const mp = calculatePlanProgress(milestone.tasks);
          const isCurrent = milestone.id === currentMilestone?.id && !completed;
          return (
            <Card key={milestone.id} className={isCurrent ? "border-blue-500/50" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${mp.percentage === 100 ? "bg-green-500" : mp.percentage > 0 ? "bg-blue-500" : "bg-muted-foreground/30"}`} />
                    <div>
                      <CardTitle className="text-lg">{milestone.title}</CardTitle>
                      {milestone.system && <p className="text-sm text-muted-foreground">النظام: {milestone.system.name}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{mp.percentage}%</span>
                    <p className="text-xs text-muted-foreground">{mp.completed}/{mp.total}</p>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 mt-2">
                  <div className={`rounded-full h-2 transition-all duration-500 ${mp.percentage === 100 ? "bg-green-500" : "bg-primary"}`} style={{ width: `${mp.percentage}%` }} />
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {milestone.tasks.map((task) => {
                    const isDone = task.status === "COMPLETED";
                    return (
                      <li key={task.id} className={`flex items-start gap-3 p-2 rounded-md transition-colors ${isDone ? "opacity-60" : ""}`}>
                        <Checkbox checked={isDone} disabled={isPending} onCheckedChange={() => handleToggle(task.id, isDone)} className="mt-0.5" />
                        <div className="flex-1">
                          <span className={`text-sm transition-all ${isDone ? "line-through text-muted-foreground" : ""}`}>{getTaskTitle(task)}</span>
                          {task.isOptional && <span className="text-xs text-muted-foreground ml-2">(اختياري)</span>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}