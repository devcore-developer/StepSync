import { db } from "@/lib/db";
import { callAI, AIClientError } from "@/lib/ai/client";
import {
  DAILY_RECOMMENDATION_PROMPT,
  PLAN_REVIEW_PROMPT,
  RESCHEDULE_RECOMMENDATION_PROMPT,
  CAPACITY_RECOMMENDATION_PROMPT,
} from "@/lib/ai/prompts";
import {
  dailyRecommendationSchema,
  planReviewSchema,
  rescheduleRecommendationSchema,
  capacityRecommendationSchema,
  RATE_LIMITS,
  type AIRecommendation,
  type DailyRecommendation,
  type PlanReviewRecommendation,
  type RescheduleRecommendation,
  type CapacityRecommendation,
  type AIRecommendationType,
} from "@/lib/ai/schemas";

// ─── Context Types ──────────────────────────────────

export interface AIStudyContext {
  student: {
    academicYear?: string | null;
    usmleStage?: string | null;
    studyCapacity?: number | null;
    currentSystem?: string | null;
    currentChapter?: string | null;
  };
  plan: {
    id: string;
    title: string;
    startDate: string | null;
    endDate: string | null;
    status: string;
  };
  progress: {
    totalRequiredTasks: number;
    completedRequiredTasks: number;
    remainingRequiredTasks: number;
    overallProgress: number;
    expectedProgress: number;
    actualProgress: number;
    progressDifference: number;
    daysBehind: number;
  };
  tasks: {
    id: string;
    title: string;
    type: string;
    system: string | null;
    chapter: string | null;
    estimatedDuration: number | null;
    originalScheduledDate: string | null;
    scheduledDate: string | null;
    status: string;
    isOptional: boolean;
  }[];
  history: {
    rescheduleCount: number;
    lastReschedule: {
      daysBehind: number;
      tasksMoved: number;
      createdAt: string | null;
    } | null;
  };
}

// ─── Context Builder ──────────────────────────────────

async function buildStudyContext(
  userId: string,
  recommendationType: AIRecommendationType
): Promise<{ context: AIStudyContext; planId: string }> {
  const plan = await db.studyPlan.findFirst({
    where: { userId, status: "ACTIVE" },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      status: true,
      lastRescheduledAt: true,
    },
  });

  if (!plan) {
    throw new Error("لا توجد خطة دراسية فعّالة.");
  }

  const milestones = await db.studyPlanMilestone.findMany({
    where: { planId: plan.id },
    select: {
      id: true,
      title: true,
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
          type: true,
          chapterId: true,
          resourceId: true,
          chapter: {
            select: {
              id: true,
              name: true,
              systemId: true,
              system: { select: { id: true, name: true } },
            },
          },        },
      },
    },
    orderBy: { order: "asc" },
  });

  const allTasks = milestones.flatMap((m) =>
    m.tasks.map((t) => ({
      id: t.id,
      title: t.title ?? "",
      type: t.type ?? "other",
      system: t.chapter?.system?.name ?? null,
      chapter: t.chapter?.name ?? null,
      estimatedDuration: t.estimatedHours,
      originalScheduledDate: t.originalScheduledDate?.toISOString() ?? null,
      scheduledDate: t.scheduledDate?.toISOString() ?? null,
      status: t.status,
      isOptional: t.isOptional ?? false,
    }))
  );

  const requiredTasks = allTasks.filter((t) => !t.isOptional);
  const completedRequired = requiredTasks.filter((t) => t.status === "COMPLETED");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks = allTasks.filter(
    (t) =>
      !t.isOptional &&
      t.status !== "COMPLETED" &&
      t.status !== "SKIPPED" &&
      t.scheduledDate &&
      new Date(t.scheduledDate) < today
  );

  const todayTasks = allTasks.filter(
    (t) =>
      t.scheduledDate &&
      new Date(t.scheduledDate).toDateString() === today.toDateString()
  );

  let contextTasks: typeof allTasks;
  if (recommendationType === "DAILY_RECOMMENDATION") {
    contextTasks = [...overdueTasks, ...todayTasks].slice(0, 10);
  } else if (recommendationType === "RESCHEDULE_RECOMMENDATION") {
    contextTasks = allTasks.filter(
      (t) =>
        !t.isOptional &&
        t.status !== "COMPLETED" &&
        t.status !== "SKIPPED"
    );
  } else if (recommendationType === "CAPACITY_RECOMMENDATION") {
    contextTasks = allTasks;
  } else {
    contextTasks = allTasks.slice(0, 50);
  }

  const rescheduleHistory = await db.studyPlanReschedule.findMany({
    where: { studyPlanId: plan.id },
    select: { daysBehind: true, tasksMoved: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const context: AIStudyContext = {
    student: {
      academicYear: null,
      usmleStage: null,
      studyCapacity: null,
      currentSystem: contextTasks[0]?.system ?? null,
      currentChapter: contextTasks[0]?.chapter ?? null,
    },
    plan: {
      id: plan.id,
      title: plan.title,
      startDate: plan.startDate?.toISOString() ?? null,
      endDate: plan.endDate?.toISOString() ?? null,
      status: plan.status,
    },
    progress: {
      totalRequiredTasks: requiredTasks.length,
      completedRequiredTasks: completedRequired.length,
      remainingRequiredTasks: requiredTasks.length - completedRequired.length,
      overallProgress:
        requiredTasks.length > 0
          ? Math.round((completedRequired.length / requiredTasks.length) * 100)
          : 0,
      expectedProgress: 0,
      actualProgress: 0,
      progressDifference: 0,
      daysBehind:
        overdueTasks.length > 0
          ? Math.max(
              ...overdueTasks.map((t) =>
                Math.floor(
                  (today.getTime() - new Date(t.scheduledDate!).getTime()) /
                    86400000
                )
              )
            )
          : 0,
    },
    tasks: contextTasks,
    history: {
      rescheduleCount: rescheduleHistory.length,
      lastReschedule: rescheduleHistory[0]
        ? {
            daysBehind: rescheduleHistory[0].daysBehind,
            tasksMoved: rescheduleHistory[0].tasksMoved,
            createdAt: rescheduleHistory[0].createdAt.toISOString(),
          }
        : null,
    },
  };

  return { context, planId: plan.id };
}

// ─── Rate Limiting ────────────────────────────────────

async function checkRateLimit(
  userId: string,
  planId: string,
  type: AIRecommendationType
): Promise<{ allowed: boolean; reason?: string }> {
  const limit = RATE_LIMITS[type];
  const cooldownMs = limit.cooldownHours * 60 * 60 * 1000;
  const maxPerDay = limit.maxPerDay;

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const countToday = await db.aIRecommendation.count({
    where: {
      userId,
      studyPlanId: planId,
      type,
      createdAt: { gte: dayStart },
    },
  });

  if (countToday >= maxPerDay) {
    return {
      allowed: false,
      reason: `وصلت للحد الأقصى اليوم (${maxPerDay}). حاول غداً.`,
    };
  }

  const recent = await db.aIRecommendation.findFirst({
    where: {
      userId,
      studyPlanId: planId,
      type,
      createdAt: { gte: new Date(Date.now() - cooldownMs) },
    },
  });

  if (recent) {
    return {
      allowed: false,
      reason: `انتظر ${limit.cooldownHours} ساعة بين كل طلب.`,
    };
  }

  return { allowed: true };
}

// ─── Store Recommendation ──────────────────────────────────

async function storeRecommendation(
  userId: string,
  planId: string,
  type: string,
  summary: string
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.aIRecommendation.create({
    data: { userId, studyPlanId: planId, type, summary, expiresAt },
  });
}

// ─── Main Planner Function ───────────────────────────

export async function getAIRecommendation(
  userId: string,
  type: AIRecommendationType
): Promise<AIRecommendation> {
  const { context, planId } = await buildStudyContext(userId, type);

  const rateCheck = await checkRateLimit(userId, planId, type);
  if (!rateCheck.allowed) {
    throw new Error(rateCheck.reason);
  }

  let result: AIRecommendation;

  switch (type) {
    case "DAILY_RECOMMENDATION": {
      const response = await callAI(
        DAILY_RECOMMENDATION_PROMPT,
        JSON.stringify(context, null, 2)
      );
      result = dailyRecommendationSchema.parse(
        JSON.parse(response)
      ) as AIRecommendation;
      break;
    }
    case "PLAN_REVIEW": {
      const response = await callAI(
        PLAN_REVIEW_PROMPT,
        JSON.stringify(context, null, 2)
      );
      result = planReviewSchema.parse(
        JSON.parse(response)
      ) as AIRecommendation;
      break;
    }
    case "RESCHEDULE_RECOMMENDATION": {
      const response = await callAI(
        RESCHEDULE_RECOMMENDATION_PROMPT,
        JSON.stringify(context, null, 2)
      );
      result = rescheduleRecommendationSchema.parse(
        JSON.parse(response)
      ) as AIRecommendation;
      break;
    }
    case "CAPACITY_RECOMMENDATION": {
      const response = await callAI(
        CAPACITY_RECOMMENDATION_PROMPT,
        JSON.stringify(context, null, 2)
      );
      result = capacityRecommendationSchema.parse(
        JSON.parse(response)
      ) as AIRecommendation;
      break;
    }
    default:
      throw new Error(`نوع التوصية غير معروف: ${type}`);
  }

  await storeRecommendation(userId, planId, type, result.summary);

  return result;
}