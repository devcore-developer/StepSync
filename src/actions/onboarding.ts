"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UsmleStage } from "@prisma/client";
import z from "zod";

const onboardingSchema = z.object({
  academicYear: z.string().max(50).optional().nullable(),
  currentUsmleStage: z.nativeEnum(UsmleStage).optional().nullable(),
  currentSystemId: z.string().min(1).optional().nullable(),
  currentChapterId: z.string().min(1).optional().nullable(),
  residenceArea: z.string().max(200).optional().nullable(),
  preferredStudyTime: z.string().max(100).optional().nullable(),
});

function getString(formData: FormData, key: string): string | null {
  const val = formData.get(key);
  if (!val || val instanceof File) return null;
  const str = val.toString();
  return str === "" ? null : str;
}

export async function completeOnboarding(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "غير مصرح" };

  const userId = session.user.id;

  const raw = {
    academicYear: getString(formData, "academicYear"),
    currentUsmleStage: getString(formData, "currentUsmleStage"),
    currentSystemId: getString(formData, "currentSystemId"),
    currentChapterId: getString(formData, "currentChapterId"),
    residenceArea: getString(formData, "residenceArea"),
    preferredStudyTime: getString(formData, "preferredStudyTime"),
  };

  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) return { error: "بيانات غير صالحة" };

  try {
    await db.profile.update({
      where: { userId },
      data: {
        ...parsed.data,
        studyPreferences: {
          availableHours: getString(formData, "availableHours"),
          preferredDays: getString(formData, "preferredDays"),
          interestedInPartners: formData.get("interestedInPartners") === "on",
          interestedInGroups: formData.get("interestedInGroups") === "on",
          genderPreference: getString(formData, "genderPreference"),
          locationPreference: getString(formData, "locationPreference"),
        },
      },
    });

    await db.user.update({
      where: { id: userId },
      data: { isOnboarded: true },
    });

    return { success: "تم حفظ التفضيلات بنجاح!" };
  } catch {
    return { error: "فشل حفظ التفضيلات." };
  }
}