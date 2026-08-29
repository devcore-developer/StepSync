"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getTemplateDetails } from "@/actions/student/templates";
import { toggleTaskSchema } from "@/lib/validations/study-plan";
import { MilestoneStatus } from "@prisma/client";
import { calculateDrift, type DriftResult, type DriftPlanInput } from "@/lib/drift";
import { createNotification } from "@/lib/notifications";
import { ACCOUNTABILITY_MESSAGES } from "@/lib/constants/drift";
import { calculateReschedule, type RescheduleResult } from "@/lib/rescheduler";
import { RESCHEDULING_CONFIG } from "@/lib/constants/rescheduling";
import { getReschedulePreviewSchema, rescheduleStudyPlanSchema } from "@/lib/validations/study-plan";

// ═══════════════════════════════════════════════════════════
//  GET STUDY PLAN — 🔴 FIXED: IDOR — ignores client userId
// ═══════════════════════════════════════════════════════════

export async function getStudyPlan(_clientUserId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("غير مصرح");

  // Security: always derive from session
  const userId = session.user.id;

  const plan = await db.studyPlan.findFirst({
    where: { userId, status: "ACTIVE" },
    include: {
      milestones: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
            include: {
              chapter: {
                include: { system: { select: { id: true, name: true } } },
              },
              resource: {
                include: { system: { select: { id: true, name: true } } },
              },
            },
          },
          system: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!plan) return null;

  return {
    id: plan.id,
    title: plan.title,
    description: plan.description,
    status: plan.status,
    startDate: plan.startDate?.toISOString() ?? null,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    milestones: plan.milestones.map((m) => ({
      id: m.id,
      title: m.title,
      order: m.order,
      status: m.status,
      system: m.system ? { id: m.system.id, name: m.system.name } : null,
      tasks: m.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        type: t.chapterId
          ? ("chapter" as const)
          : t.resourceId
            ? ("resource" as const)
            : ("other" as const),
        status: t.status,
        isOptional: t.isOptional,
        scheduledDate: t.scheduledDate?.toISOString() ?? null,
        completedAt: t.completedAt?.toISOString() ?? null,
        chapter: t.chapter
          ? {
              id: t.chapter.id,
              title: t.chapter.name,
              systemId: t.chapter.systemId ?? undefined,
              system: t.chapter.system
                ? { id: t.chapter.system.id, name: t.chapter.system.name }
                : null,
            }
          : null,
        resource: t.resource
          ? {
              id: t.resource.id,
              name: t.resource.name,
              type: t.resource.type,
              url: t.resource.url,
              systemId: t.resource.systemId ?? undefined,
              system: t.resource.system
                ? { id: t.resource.system.id, name: t.resource.system.name }
                : null,
            }
          : null,
      })),
    })),
  };
}

// ═══════════════════════════════════════════════════════════
//  COMPLETE TASK
// ═══════════════════════════════════════════════════════════

export async function completeTask(taskId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("غير مصرح");

  toggleTaskSchema.parse({ taskId });

  const plan = await db.studyPlan.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: { milestones: { include: { tasks: true } } },
  });

  if (!plan) throw new Error("لا توجد خطة فعّالة");

  let targetMilestone: (typeof plan.milestones)[0] | null = null;
  let targetTask: (typeof plan.milestones)[0]["tasks"][0] | null = null;

  for (const milestone of plan.milestones) {
    const found = milestone.tasks.find((t) => t.id === taskId);
    if (found) {
      targetMilestone = milestone;
      targetTask = found;
      break;
    }
  }

  if (!targetMilestone || !targetTask) throw new Error("المهمة غير موجودة");
  if (targetTask.status === "COMPLETED") throw new Error("المهمة مكتملة بالفعل");

  await db.$transaction(async (tx) => {
    await tx.studyPlan.update({
      where: { id: plan.id },
      data: {
        milestones: {
          update: {
            where: { id: targetMilestone!.id },
            data: {
              tasks: {
                update: {
                  where: { id: taskId },
                  data: { status: "COMPLETED", completedAt: new Date() },
                },
              },
            },
          },
        },
      },
    });

    const requiredTasks = targetMilestone.tasks.filter((t) => !t.isOptional);
    const completedCount = requiredTasks.filter(
      (t) => t.status === "COMPLETED" || t.id === taskId
    ).length;

    let newMilestoneStatus: MilestoneStatus;
    if (completedCount === requiredTasks.length) newMilestoneStatus = "COMPLETED";
    else if (completedCount > 0) newMilestoneStatus = "IN_PROGRESS";
    else newMilestoneStatus = "NOT_STARTED";

    await tx.studyPlan.update({
      where: { id: plan.id },
      data: {
        milestones: {
          update: {
            where: { id: targetMilestone!.id },
            data: { status: newMilestoneStatus },
          },
        },
      },
    });

    const allCompleted = plan.milestones.every(
      (m) =>
        m.id === targetMilestone!.id
          ? newMilestoneStatus === "COMPLETED"
          : m.status === "COMPLETED"
    );

    if (allCompleted) {
      await tx.studyPlan.update({
        where: { id: plan.id },
        data: { status: "COMPLETED" },
      });
    }
  });

  revalidatePath("/study-plan");
  revalidatePath("/dashboard");

  return { id: taskId, status: "COMPLETED", completedAt: new Date().toISOString() };
}

// ═══════════════════════════════════════════════════════════
//  UNCOMPLETE TASK — 🔴 FIX: نقل تغيير حالة الخطة جوه الـ transaction
// ═══════════════════════════════════════════════════════════

export async function uncompleteTask(taskId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("غير مصرح");

  toggleTaskSchema.parse({ taskId });

  const plan = await db.studyPlan.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: { milestones: { include: { tasks: true } } },
  });

  if (!plan) throw new Error("لا توجد خطة فعّالة");

  let targetMilestone: (typeof plan.milestones)[0] | null = null;
  let targetTask: (typeof plan.milestones)[0]["tasks"][0] | null = null;

  for (const milestone of plan.milestones) {
    const found = milestone.tasks.find((t) => t.id === taskId);
    if (found) {
      targetMilestone = milestone;
      targetTask = found;
      break;
    }
  }

  if (!targetMilestone || !targetTask) throw new Error("المهمة غير موجودة");
  if (targetTask.status !== "COMPLETED") throw new Error("المهمة مش مكتملة");

  // 🔴 FIX: احفظ إن الخطة كانت مكتملة، لكن ما تعدلش الحالة إلا جوه الـ transaction
  const planWasCompleted = plan.status === "COMPLETED";

  await db.$transaction(async (tx) => {
    // تغيير حالة الخطة جوه الـ transaction — لو حصل خطأ بعده، كل شيء بيرجع
    if (planWasCompleted) {
      await tx.studyPlan.update({
        where: { id: plan.id },
        data: { status: "ACTIVE" },
      });
    }

    await tx.studyPlan.update({
      where: { id: plan.id },
      data: {
        milestones: {
          update: {
            where: { id: targetMilestone!.id },
            data: {
              tasks: {
                update: {
                  where: { id: taskId },
                  data: { status: "PENDING", completedAt: null },
                },
              },
            },
          },
        },
      },
    });

    const requiredTasks = targetMilestone.tasks.filter((t) => !t.isOptional);
    const completedCount = requiredTasks.filter(
      (t) => t.id !== taskId && t.status === "COMPLETED"
    ).length;

    let newMilestoneStatus: MilestoneStatus;
    if (completedCount === 0) newMilestoneStatus = "NOT_STARTED";
    else newMilestoneStatus = "IN_PROGRESS";

    await tx.studyPlan.update({
      where: { id: plan.id },
      data: {
        milestones: {
          update: {
            where: { id: targetMilestone!.id },
            data: { status: newMilestoneStatus },
          },
        },
      },
    });
  });

  revalidatePath("/study-plan");
  revalidatePath("/dashboard");

  return { id: taskId, status: "PENDING", completedAt: null };
}

// ═══════════════════════════════════════════════════════════
//  CREATE FROM TEMPLATE
// ═══════════════════════════════════════════════════════════

// src/actions/student/study-plans.ts
// استبدل دالة createStudyPlanFromTemplate بالكامل

export async function createStudyPlanFromTemplate(
  templateId: string,
  options?: { startDate?: string }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("غير مصرح");

  const userId = session.user.id;

  const existing = await db.studyPlan.findFirst({
    where: { userId, status: "ACTIVE" },
  });
  if (existing) throw new Error("لديك خطة دراسية فعّالة بالفعل");

  const template = await getTemplateDetails(templateId);
  if (!template) throw new Error("القالب غير موجود");

  const t = template as any;
  const templateMilestones: any[] = t.milestones ?? [];

  // حساب تاريخ البداية
  const startDate = options?.startDate
    ? new Date(options.startDate)
    : new Date();
  startDate.setHours(0, 0, 0, 0);

  const plan = await db.studyPlan.create({
    data: {
      userId,
      title: t.title ?? "خطة دراسية",
      description: t.description ?? null,
      status: "ACTIVE",
      isActive: true,
      sourceType: "TEMPLATE",
      // ✅ FIX: استخدم الـ id الحقيقي من الـ DB مش الـ slug من الـ URL
      sourceTemplateId: t.id,
      startDate,
      milestones: {
        create: templateMilestones.map((m: any) => {
          const milestoneTasks: any[] =
            m.tasks ??
            (t.tasks ?? []).filter(
              (tk: any) => tk.milestoneId === m.id || tk.templateMilestoneId === m.id
            );

          // حساب تواريخ الـ milestone
          const milestoneStart = m.startDayOffset
            ? addDays(startDate, m.startDayOffset - 1)
            : startDate;
          const milestoneEnd = m.endDayOffset
            ? addDays(startDate, m.endDayOffset - 1)
            : null;

          return {
            title: m.title,
            order: m.order ?? 0,
            systemId: m.systemId ?? null,
            startDate: milestoneStart,
            targetEndDate: milestoneEnd,
            tasks: {
              create: milestoneTasks.map((tk: any) => {
                // حساب scheduledDate من startDayOffset
                const scheduledDate = tk.startDayOffset
                  ? addDays(startDate, tk.startDayOffset - 1)
                  : milestoneStart;

                return {
                  title: tk.title ?? "",
                  type: tk.type ?? "CUSTOM",
                  order: tk.order ?? 0,
                  isOptional: tk.isOptional ?? false,
                  status: "PENDING" as const,
                  chapterId: tk.chapterId ?? null,
                  resourceId: tk.resourceId ?? null,
                  estimatedHours: tk.estimatedHours ?? null,
                  scheduledDate,
                  originalScheduledDate: scheduledDate,
                };
              }),
            },
          };
        }),
      },
    },
    include: {
      milestones: { include: { tasks: true } },
    },
  });

  // حساب endDate من آخر مهمة
  const allTasks = plan.milestones.flatMap((m) => m.tasks);
  const lastTask = allTasks
    .filter((t) => t.scheduledDate)
    .sort((a, b) => a.scheduledDate!.getTime() - b.scheduledDate!.getTime())
    .pop();

  if (lastTask?.scheduledDate) {
    await db.studyPlan.update({
      where: { id: plan.id },
      data: { endDate: lastTask.scheduledDate },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/study-plan");
  return plan;
}

// Helper function
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ═══════════════════════════════════════════════════════════
//  DRIFT — getUserDrift
// ═══════════════════════════════════════════════════════════

export async function getUserDrift(): Promise<DriftResult | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const plan = await db.studyPlan.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    select: {
      id: true,
      status: true,
      startDate: true,
      milestones: {
        select: {
          id: true,
          title: true,
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
              isOptional: true,
              scheduledDate: true,
              completedAt: true,
              order: true,
              chapterId: true,
              resourceId: true,
              chapter: {
                select: {
                  id: true,
                  name: true,
                  system: { select: { id: true, name: true } },
                },
              },              resource: {
                select: {
                  id: true,
                  name: true,
                  system: { select: { id: true, name: true } },
                },
              },
            },
          },
          system: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!plan) return null;

  const planInput: DriftPlanInput = {
    status: plan.status,
    startDate: plan.startDate,
    tasks: plan.milestones.flatMap((m) =>
      m.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        isOptional: t.isOptional,
        scheduledDate: t.scheduledDate,
        completedAt: t.completedAt,
        order: t.order,
        milestoneId: m.id,
        milestoneTitle: m.title,
        systemName:
          t.chapter?.system?.name ??
          t.resource?.system?.name ??
          m.system?.name ??
          null,
        chapterName: t.chapter?.name ?? null,
        resourceName: t.resource?.name ?? null,
      }))
    ),
  };

  return calculateDrift(planInput);
}

// ═══════════════════════════════════════════════════════════
//  DRIFT NOTIFICATION
// ═══════════════════════════════════════════════════════════

export async function maybeCreateDriftNotification(
  drift: DriftResult
): Promise<void> {
  if (drift.status === "ON_TRACK" || drift.status === "COMPLETED") return;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;

  const msg = ACCOUNTABILITY_MESSAGES[drift.status];
  const title = msg.title.replace("{days}", String(drift.daysBehind));

  await createNotification({
    userId: session.user.id,
    type: "DRIFT_WARNING",
    title,
    message: `${msg.description} عندك ${drift.overdueTaskCount} مهمة متأخرة.`,
  });
}

// ═══════════════════════════════════════════════════════════
//  RESCHEDULE PREVIEW
// ═══════════════════════════════════════════════════════════

export async function getReschedulePreview(): Promise<RescheduleResult | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("غير مصرح");

  const plan = await db.studyPlan.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      lastRescheduledAt: true,
      milestones: {
        select: {
          id: true,
          order: true,
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
              isOptional: true,
              scheduledDate: true,
              originalScheduledDate: true,
              estimatedHours: true,
              order: true,
            },
          },
        },
      },
    },
  });

  if (!plan) return null;
  if (plan.status === "COMPLETED") {
    return {
      needsReschedule: false,
      reason: "الخطة مكتملة بالفعل.",
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

  if (plan.lastRescheduledAt) {
    const cooldownMs = RESCHEDULING_CONFIG.RESCHEDULE_COOLDOWN_HOURS * 60 * 60 * 1000;
    const timeSinceLastReschedule = Date.now() - plan.lastRescheduledAt.getTime();
    if (timeSinceLastReschedule < cooldownMs) {
      return {
        needsReschedule: false,
        reason: `تم إعادة الجدولة مؤخراً. انتظر ${RESCHEDULING_CONFIG.RESCHEDULE_COOLDOWN_HOURS} ساعة.`,
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
  }

  const tasks = plan.milestones.flatMap((m) =>
    m.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      isOptional: t.isOptional,
      scheduledDate: t.scheduledDate ?? new Date(),
      originalScheduledDate: t.originalScheduledDate ?? t.scheduledDate ?? new Date(),
      estimatedDuration: t.estimatedHours ? t.estimatedHours * 60 : null,
      order: t.order,
      milestoneId: m.id,
      milestoneOrder: m.order,
    }))
  );

  return calculateReschedule({
    today: new Date(),
    planStartDate: plan.startDate,
    planEndDate: plan.endDate,
    tasks,
  });
}

// ═══════════════════════════════════════════════════════════
//  APPLY RESCHEDULE
// ═══════════════════════════════════════════════════════════

export interface ApplyRescheduleResult {
  success: boolean;
  message: string;
  tasksMoved: number;
  newEndDate: string | null;
}

export async function rescheduleStudyPlan(): Promise<ApplyRescheduleResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("غير مصرح");

  const preview = await getReschedulePreview();

  if (!preview) {
    return { success: false, message: "لا توجد خطة فعّالة.", tasksMoved: 0, newEndDate: null };
  }

  if (!preview.needsReschedule) {
    return { success: false, message: preview.reason || "لا حاجة لإعادة الجدولة.", tasksMoved: 0, newEndDate: null };
  }

  const plan = await db.studyPlan.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: {
      milestones: {
        include: { tasks: { select: { id: true } } },
      },
    },
  });

  if (!plan) {
    return { success: false, message: "لا توجد خطة فعّالة.", tasksMoved: 0, newEndDate: null };
  }

  const newDatesMap = new Map<string, Date>();
  for (const change of preview.proposedChanges) {
    newDatesMap.set(change.taskId, new Date(change.newScheduledDate));
  }

  const allTaskIds = plan.milestones.flatMap((m) => m.tasks.map((t) => t.id));
  const tasksToUpdate = allTaskIds.filter((id) => newDatesMap.has(id));

  const result = await db.$transaction(async (tx) => {
    // Batch update using updateMany per task (more efficient than nested)
    for (const taskId of tasksToUpdate) {
      const newDate = newDatesMap.get(taskId)!;
      await tx.studyPlanTask.update({
        where: { id: taskId },
        data: { scheduledDate: newDate },
      });
    }

    let newEndDate: Date | null = null;
    if (preview.projectedEndDate && !preview.canFitWithinCurrentEndDate) {
      newEndDate = new Date(preview.projectedEndDate);
      await tx.studyPlan.update({
        where: { id: plan.id },
        data: {
          endDate: newEndDate,
          lastRescheduledAt: new Date(),
        },
      });
    } else {
      await tx.studyPlan.update({
        where: { id: plan.id },
        data: { lastRescheduledAt: new Date() },
      });
    }

    await tx.studyPlanReschedule.create({
      data: {
        studyPlanId: plan.id,
        trigger: "MANUAL",
        daysBehind: preview.daysShifted,
        tasksMoved: preview.tasksMoved,
        oldEndDate: plan.endDate,
        newEndDate,
      },
    });

    return {
      success: true,
      message: preview.summary,
      tasksMoved: preview.tasksMoved,
      newEndDate: newEndDate?.toISOString() ?? null,
    };
  });

  if (result.success) {
    const endMessage = result.newEndDate
      ? ` تاريخ الانتهاء الجديد: ${new Date(result.newEndDate).toLocaleDateString("ar-EG")}.`
      : "";

    await createNotification({
      userId: session.user.id,
      type: "RESCHEDULE_COMPLETED",
      title: "تم تعديل خطتك الدراسية",
      message: `تم إعادة جدولة ${result.tasksMoved} مهمة لمساعدتك على العودة للمسار الصحيح.${endMessage}`,
    });
  }

  revalidatePath("/study-plan");
  revalidatePath("/dashboard");

  return result;
}