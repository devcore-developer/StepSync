"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "./common";
import { resourceSchema } from "@/lib/validations/content";
import { Prisma } from "@prisma/client";

function getVal(formData: FormData, key: string): string | null {
  const val = formData.get(key);
  if (val === "" || val === null || val === undefined || val instanceof File) return null;
  return val.toString();
}

function buildResourceData(formData: FormData) {
  const parsed = resourceSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    type: formData.get("type"),
    description: getVal(formData, "description"),
    url: getVal(formData, "url"),
    estimatedDuration: formData.get("estimatedDuration") ? Number(formData.get("estimatedDuration")) : undefined,
    systemId: getVal(formData, "systemId") ?? undefined,
    chapterId: getVal(formData, "chapterId") ?? undefined,
    order: Number(formData.get("order")) || 0,
    isActive: formData.get("isActive") === "on",
  });

  // Prisma expects number | null, not number | ""
  const estDur = typeof parsed.estimatedDuration === "number" ? parsed.estimatedDuration : undefined;

  const data: Prisma.ResourceUncheckedCreateInput = {
    name: parsed.name,
    slug: parsed.slug,
    type: parsed.type,
    order: parsed.order,
    isActive: parsed.isActive,
    ...(parsed.description != null && { description: parsed.description }),
    ...(parsed.url != null && { url: parsed.url }),
    ...(estDur != null && { estimatedDuration: estDur }),
    ...(parsed.systemId != null && { systemId: parsed.systemId }),
    ...(parsed.chapterId != null && { chapterId: parsed.chapterId }),
  };

  return data;
}

export async function createResource(formData: FormData) {
  await requireAdmin();
  const data = buildResourceData(formData);
  await db.resource.create({ data });
  return { success: "تم إنشاء المورد" };
}

export async function updateResource(id: string, formData: FormData) {
  await requireAdmin();
  const data = buildResourceData(formData);
  await db.resource.update({ where: { id }, data });
  return { success: "تم تحديث المورد" };
}