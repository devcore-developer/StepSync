"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "./common";
import { templateSchema } from "@/lib/validations/content";
import { revalidatePath } from "next/cache";

function getVal(formData: FormData, key: string): string | null {
  const val = formData.get(key);
  if (val === "" || val === null || val === undefined || val instanceof File) return null;
  return val.toString();
}

export async function createTemplate(formData: FormData) {
  const admin = await requireAdmin();
  const data = templateSchema.parse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    durationWeeks: formData.get("durationWeeks"),
    status: formData.get("status"),
  });

  await db.scheduleTemplate.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: getVal(formData, "description"),
      durationWeeks: data.durationWeeks,
      recommendedStudyHours: formData.get("recommendedStudyHours") ? Number(formData.get("recommendedStudyHours")) : null,
      status: data.status,
      creatorId: admin.id,
    },
  });
  revalidatePath("/admin/templates");
  return { success: "تم إنشاء القالب" };
}

export async function updateTemplate(id: string, formData: FormData) {
  await requireAdmin();
  const data = templateSchema.parse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    durationWeeks: formData.get("durationWeeks"),
    status: formData.get("status"),
  });

  await db.scheduleTemplate.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      description: getVal(formData, "description"),
      durationWeeks: data.durationWeeks,
      recommendedStudyHours: formData.get("recommendedStudyHours") ? Number(formData.get("recommendedStudyHours")) : null,
      status: data.status,
    },
  });
  revalidatePath(`/admin/templates/${id}`);
  return { success: "تم تحديث القالب" };
}

export async function publishTemplate(id: string) {
  await requireAdmin();
  await db.scheduleTemplate.update({ where: { id }, data: { status: "PUBLISHED" } });
  revalidatePath("/admin/templates");
}

export async function archiveTemplate(id: string) {
  await requireAdmin();
  await db.scheduleTemplate.update({ where: { id }, data: { status: "ARCHIVED" } });
  revalidatePath("/admin/templates");
}