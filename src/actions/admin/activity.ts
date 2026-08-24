"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "./common";
import { adminAuditLogSchema } from "@/lib/validations/admin";
import type { ActivityLogEntry } from "@/types/admin";

export async function getActivityLog(raw: unknown) {
  await requireAdmin();
  const { page, limit } = adminAuditLogSchema.parse(raw);

  const [logs, total] = await Promise.all([
    db.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        admin: {
          select: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
    db.adminAuditLog.count(),
  ]);

  const entries: ActivityLogEntry[] = logs.map((log) => ({
    id: log.id,
    adminUserId: log.adminUserId,
    adminName: log.admin?.profile
      ? `${log.admin.profile.firstName ?? ""} ${log.admin.profile.lastName ?? ""}`.trim() || "مدير"
      : "مدير",
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    metadata: log.metadata as Record<string, unknown> | null,
    createdAt: log.createdAt.toISOString(),
  }));

  return { entries, total, page, limit };
}