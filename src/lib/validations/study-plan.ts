// src/lib/validations/study-plan.ts — الملف كامل
import { z } from "zod";

export const toggleTaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
});

// ← أضف دول بس، مش import تاني
export const rescheduleStudyPlanSchema = z.object({}).strict();
export const getReschedulePreviewSchema = z.object({}).strict();