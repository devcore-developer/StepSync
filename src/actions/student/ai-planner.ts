"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAIRecommendation } from "@/lib/ai/planner";
import type {
  DailyRecommendation,
  PlanReviewRecommendation,
  RescheduleRecommendation,
  CapacityRecommendation,
} from "@/lib/ai/schemas";

export async function getDailyAIRecommendation(): Promise<DailyRecommendation> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("غير مصرح");

  const result = await getAIRecommendation(session.user.id, "DAILY_RECOMMENDATION");
  return result as DailyRecommendation;
}

export async function getAIPlanReview(): Promise<PlanReviewRecommendation> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("غير مصرح");

  const result = await getAIRecommendation(session.user.id, "PLAN_REVIEW");
  return result as PlanReviewRecommendation;
}

export async function getAIRescheduleRecommendation(): Promise<RescheduleRecommendation> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("غير مصرح");

  const result = await getAIRecommendation(session.user.id, "RESCHEDULE_RECOMMENDATION");
  return result as RescheduleRecommendation;
}

export async function getAICapacityRecommendation(): Promise<CapacityRecommendation> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("غير مصرح");

  const result = await getAIRecommendation(session.user.id, "CAPACITY_RECOMMENDATION");
  return result as CapacityRecommendation;
}