import { z } from "zod";

export const adminRangeSchema = z.enum(["7d", "30d", "90d", "all"]).default("30d");

export const adminUserSearchSchema = z.object({
  search: z.string().max(100).optional(),
  role: z.enum(["STUDENT", "ADMIN", "ALL"]).default("ALL"),
  onboarding: z.enum(["COMPLETE", "INCOMPLETE", "ALL"]).default("ALL"),
  usmleStage: z.string().optional(),
  academicYear: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminUserIdSchema = z.object({
  userId: z.string().min(1),
});

export const adminRoleChangeSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["STUDENT", "ADMIN"]),
});

export const adminAuditLogSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});