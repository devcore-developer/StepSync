import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "الاسم مطلوب (3 أحرف على الأقل)")
    .max(80, "الاسم طويل جداً"),
  description: z
    .string()
    .trim()
    .max(500, "الوصف طويل جداً")
    .optional()
    .or(z.literal("")),
  goal: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal("")),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  currentSystemId: z.string().optional(),
  currentChapterId: z.string().optional(),
  studyLocationId: z.string().optional(),
  preferredStudyTime: z.string().optional(),
  maxMembers: z
    .number()
    .int()
    .min(2)
    .max(50)
    .optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().trim().min(3).max(80).optional(),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  goal: z.string().trim().max(300).optional().or(z.literal("")),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  currentSystemId: z.string().optional(),
  currentChapterId: z.string().optional(),
  studyLocationId: z.string().optional(),
  preferredStudyTime: z.string().optional(),
  maxMembers: z.number().int().min(2).max(50).optional(),
});

export const groupFiltersSchema = z.object({
  systemId: z.string().optional(),
  chapterId: z.string().optional(),
  visibility: z.string().optional(),
  locationId: z.string().optional(),
  search: z.string().optional(),
});

export const groupIdSchema = z.object({
  groupId: z.string().min(1, "معرف المجموعة مطلوب"),
});

export const membershipIdSchema = z.object({
  membershipId: z.string().min(1, "معرف العضوية مطلوب"),
});