import { z } from "zod";

export const partnerFiltersSchema = z.object({
  systemId: z.string().optional(),
  chapterId: z.string().optional(),
  gender: z.string().optional(),
  academicYear: z.string().optional(),
  usmleStage: z.string().optional(),
  studyTime: z.string().optional(),
  locationId: z.string().optional(),
});

export const sendPartnerRequestSchema = z.object({
  candidateId: z.string().min(1, "معرف المرشح مطلوب"),
});

export const partnerRequestActionSchema = z.object({
  requestId: z.string().min(1, "معرف الطلب مطلوب"),
});