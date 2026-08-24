"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "./common";
import { chapterSchema } from "@/lib/validations/content";

export async function createChapter(formData: FormData) {
  await requireAdmin();
  const data = chapterSchema.parse(Object.fromEntries(formData));
  try {
    await db.chapter.create({ data });
    return { success: "تم إنشاء الفصل" };
  } catch {
    return { error: "فشل إنشاء الفصل. قد يكون الاسم أو الرابط موجوداً بالفعل." };
  }
}

export async function updateChapter(id: string, formData: FormData) {
  await requireAdmin();
  const data = chapterSchema.parse(Object.fromEntries(formData));
  try {
    await db.chapter.update({ where: { id }, data });
    return { success: "تم تحديث الفصل" };
  } catch {
    return { error: "فشل تحديث الفصل. قد يكون الاسم أو الرابط موجوداً بالفعل." };
  }
}