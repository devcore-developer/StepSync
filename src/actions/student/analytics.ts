// src/actions/student/analytics.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  calculateOverallProgress,
  calculateConsistency,
  calculateWeeklyActivity,
  calculateSystemProgress,
  calculateMilestoneAnalytics,
  calculatePlanHealth,
  calculateRescheduleAnalytics,
  calculateAIUsage,
} from "@/lib/analytics/student";
import type { StudentAnalytics } from "@/lib/analytics/types";

export async function getStudentAnalytics(): Promise<StudentAnalytics | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // 🔴 FIX: شيلنا isActive: true — ده كان بيخلي Analytics دايماً ترجع null
  // لأن isActive مش بيتسجل أبداً في أي مكان في الكود
  const plan = await db.studyPlan.findFirst({
    where: { userId, status: "ACTIVE" },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      targetExamDate: true,
      status: true,
      sourceType: true,
    },
  });

  if (!plan) return null;

  const planStr = {
    startDate: plan.startDate?.toISOString() ?? null,
    endDate: plan.endDate?.toISOString() ?? null,
    targetExamDate: plan.targetExamDate?.toISOString() ?? null,
    status: plan.status,
    sourceType: plan.sourceType,
  };

  const [tasksRaw, milestonesRaw, reschedulesRaw, aiRecsRaw] = await Promise.all([
    db.studyPlanTask.findMany({
      where: { milestone: { planId: plan.id } },
      select: {
        status: true,
        isOptional: true,
        scheduledDate: true,
        completedAt: true,
        milestoneId: true,
        chapter: {
          select: { system: { select: { name: true, slug: true } } },
        },
        resource: {
          select: { system: { select: { name: true, slug: true } } },
        },
      },
    }),
    db.studyPlanMilestone.findMany({
      where: { planId: plan.id },
      select: {
        id: true,
        title: true,
        startDate: true,
        targetEndDate: true,
        status: true,
        order: true,
        system: { select: { name: true, slug: true } },
      },
      orderBy: { order: "asc" },
    }),
    db.studyPlanReschedule.findMany({
      where: { studyPlanId: plan.id },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        trigger: true,
        daysBehind: true,
        tasksMoved: true,
        oldEndDate: true,
        newEndDate: true,
      },
    }),
    db.aIRecommendation.findMany({
      where: { studyPlanId: plan.id },
      select: { type: true, createdAt: true, summary: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const tasks = tasksRaw.map((t) => ({
    status: t.status,
    isOptional: t.isOptional,
    scheduledDate: t.scheduledDate?.toISOString() ?? null,
    completedAt: t.completedAt?.toISOString() ?? null,
    milestoneId: t.milestoneId,
    chapter: t.chapter ? { system: t.chapter.system } : null,
    resource: t.resource ? { system: t.resource.system } : null,
  }));

  const milestones = milestonesRaw.map((m) => ({
    id: m.id,
    title: m.title,
    startDate: m.startDate?.toISOString() ?? null,
    targetEndDate: m.targetEndDate?.toISOString() ?? null,
    status: m.status,
    order: m.order,
    system: m.system,
  }));

  const reschedules = reschedulesRaw.map((r) => ({
    createdAt: r.createdAt.toISOString(),
    trigger: r.trigger,
    daysBehind: r.daysBehind,
    tasksMoved: r.tasksMoved,
    oldEndDate: r.oldEndDate?.toISOString() ?? null,
    newEndDate: r.newEndDate?.toISOString() ?? null,
  }));

  const aiRecs = aiRecsRaw.map((r) => ({
    type: r.type,
    createdAt: r.createdAt.toISOString(),
    summary: r.summary,
  }));

  return {
    plan: {
      id: plan.id,
      title: plan.title,
      startDate: planStr.startDate,
      endDate: planStr.endDate,
      targetExamDate: planStr.targetExamDate,
      status: planStr.status,
      sourceType: planStr.sourceType,
    },
    overallProgress: calculateOverallProgress(tasks, milestones, planStr),
    consistency: calculateConsistency(tasks, planStr.startDate),
    weeklyActivity: calculateWeeklyActivity(tasks),
    systemProgress: calculateSystemProgress(tasks),
    milestoneAnalytics: calculateMilestoneAnalytics(tasks, milestones),
    planHealth: calculatePlanHealth(tasks, planStr),
    rescheduleHistory: calculateRescheduleAnalytics(reschedules),
    aiUsage: calculateAIUsage(aiRecs),
  };
}