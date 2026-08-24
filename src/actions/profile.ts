"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Gender } from "@prisma/client";
import z from "zod";

const profileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  academicYear: z.string().max(50).optional(),
  gender: z.nativeEnum(Gender).optional(),
});

export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "غير مصرح" };

  const userId = session.user.id;

  const validatedFields = profileSchema.safeParse({
    firstName: formData.get("firstName") || undefined,
    lastName: formData.get("lastName") || undefined,
    bio: formData.get("bio") || undefined,
    academicYear: formData.get("academicYear") || undefined,
    gender: formData.get("gender") || undefined,
  });

  if (!validatedFields.success) {
    return { error: "بيانات غير صالحة." };
  }

  try {
    await db.profile.update({
      where: { userId },
      data: validatedFields.data,
    });

    return { success: "تم تحديث الملف الشخصي." };
  } catch {
    return { error: "فشل تحديث الملف الشخصي." };
  }
}