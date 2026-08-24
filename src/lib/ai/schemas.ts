import { z } from "zod";

// ⚠️ هذا الملف بس Zod schemas
// ⚠️ لا تضف فيه parseAI أو أي شيء من client.ts
// parseAIJSON موجود فقط في src/lib/ai/client.ts — استخدمه من هناك

export const dailyRecommendationSchema = z.object({
  type: z.literal("DAILY_RECOMMENDATION"),
  summary: z.string(),
  reasoning: z.string(),
  recommendations: z.array(
    z.object({
      taskId: z.string(),
      priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
      title: z.string(),
      reason: z.string(),
      estimatedMinutes: z.number().min(1).max(480),
    })
  ),
});

export const planReviewSchema = z.object({
  type: z.literal("PLAN_REVIEW"),
  summary: z.string(),
  reasoning: z.string(),
  healthAssessment: z.enum([
    "ON_TRACK",
    "SLIGHTLY_BEHIND",
    "SIGNIFICANTLY_BEHIND",
    "AT_RISK",
  ]),
  strengths: z.array(z.string()).min(1).max(6),
  risks: z.array(z.string()).min(1).max(6),
  recommendations: z.array(z.string()).min(1).max(6),
});

export const rescheduleRecommendationSchema = z.object({
  type: z.literal("RESCHEDULE_RECOMMENDATION"),
  summary: z.string(),
  reasoning: z.string(),
  priorityTaskIds: z.array(z.string()),
  deprioritizedTaskIds: z.array(z.string()),
  recommendedDailyHours: z.number().min(1).max(12),
  recommendedEndDate: z.string().nullable(),
});

export const capacityRecommendationSchema = z.object({
  type: z.literal("CAPACITY_RECOMMENDATION"),
  summary: z.string(),
  reasoning: z.string(),
  currentDailyHours: z.number(),
  recommendedDailyHours: z.number().min(1).max(12),
  reason: z.string(),
});

export const aiRecommendationSchema = z.discriminatedUnion("type", [
  dailyRecommendationSchema,
  planReviewSchema,
  rescheduleRecommendationSchema,
  capacityRecommendationSchema,
]);

export type AIRecommendation = z.infer<typeof aiRecommendationSchema>;

export type DailyRecommendation = z.infer<typeof dailyRecommendationSchema>;
export type PlanReviewRecommendation = z.infer<typeof planReviewSchema>;
export type RescheduleRecommendation = z.infer<typeof rescheduleRecommendationSchema>;
export type CapacityRecommendation = z.infer<typeof capacityRecommendationSchema>;

export const RATE_LIMITS = {
  DAILY_RECOMMENDATION: { maxPerDay: 5, cooldownHours: 1 },
  PLAN_REVIEW: { maxPerDay: 2, cooldownHours: 12 },
  RESCHEDULE_RECOMMENDATION: { maxPerDay: 2, cooldownHours: 12 },
  CAPACITY_RECOMMENDATION: { maxPerDay: 2, cooldownHours: 12 },
} as const;

export type AIRecommendationType = AIRecommendation["type"];