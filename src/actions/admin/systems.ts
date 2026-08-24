"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "./common";
import { systemSchema } from "@/lib/validations/content";

export async function createSystem(formData: FormData) {
  await requireAdmin();
  const data = systemSchema.parse(Object.fromEntries(formData));
  try {
    await db.usmleSystem.create({ data });
    return { success: "تم إنشاء النظام" };
  } catch {
    return { error: "فشل الإنشاء. قد يكون الاسم أو الرابط موجوداً بالفعل." };
  }
}

export async function updateSystem(id: string, formData: FormData) {
  await requireAdmin();
  const data = systemSchema.parse(Object.fromEntries(formData));
  try {
    await db.usmleSystem.update({ where: { id }, data });
    return { success: "تم تحديث النظام" };
  } catch {
    return { error: "فشل التحديث. قد يكون الاسم أو الرابط موجوداً بالفعل." };
  }
}

export async function toggleSystemActive(id: string) {
  await requireAdmin();
  const system = await db.usmleSystem.findUniqueOrThrow({ where: { id } });
  await db.usmleSystem.update({ where: { id }, data: { isActive: !system.isActive } });
  return { success: "تم تبديل الحالة" };
}