"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "./common";
import { adminRangeSchema } from "@/lib/validations/admin";
import { Prisma } from "@prisma/client";
import type { AnalyticsData, AnalyticsRange } from "@/types/admin";

function getStartDate(range: AnalyticsRange): Date | null {
  switch (range) {
    case "7d": return new Date(Date.now() - 7 * 86400000);
    case "30d": return new Date(Date.now() - 30 * 86400000);
    case "90d": return new Date(Date.now() - 90 * 86400000);
    default: return null;
  }
}

export async function getAnalytics(raw: unknown): Promise<AnalyticsData> {
  await requireAdmin();
  const range = adminRangeSchema.parse(raw) as AnalyticsRange;
  const startDate = getStartDate(range);

  const where = startDate ? { createdAt: { gte: startDate } } : undefined;

  const [
    totalUsers,
    newInPeriod,
    activePlans,
    completedPlans,
    rescheduleCount,
    acceptedPartners,
    totalGroups,
    activeMemberships,
    conversations,
    messages,
    aiTotal,
    aiByTypeRaw,
    notifTotal,
    notifRead,
    notifByTypeRaw,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where }),
    db.studyPlan.count({ where: { status: "ACTIVE" } }),
    db.studyPlan.count({ where: { status: "COMPLETED" } }),
    db.studyPlanReschedule.count({ where }),
    db.studyPartnerRequest.count({ where: { status: "ACCEPTED" } }),
    db.studyGroup.count(),
    db.groupMember.count({ where: { status: "ACTIVE" } }),
    db.conversation.count(),
    db.message.count({ where }),
    db.aIRecommendation.count({ where }),
    db.aIRecommendation.groupBy({ by: ["type"], _count: true }),
    db.notification.count({ where }),
    db.notification.count({ where: { isRead: true, ...where } }),
    db.notification.groupBy({ by: ["type"], _count: true }),
  ]);

  const aiByType = aiByTypeRaw
    .map((a) => ({ type: a.type, count: Number(a._count) }))
    .sort((a, b) => b.count - a.count);

  const notifByType = notifByTypeRaw
    .map((n) => ({ type: n.type, count: Number(n._count) }))
    .sort((a, b) => b.count - a.count);

  // 🔴 FIXED: parameterized query instead of $queryRawUnsafe
  const queryDate = startDate ?? new Date(Date.now() - 30 * 86400000);
  const newUsersByDay = await db.$queryRaw<Array<{ date: string; count: number }>>(
    Prisma.sql`
      SELECT DATE("createdAt") as date, COUNT(*)::int as count
      FROM users
      WHERE "createdAt" >= ${queryDate.toISOString()}
      GROUP BY DATE("createdAt")
      ORDER BY date
    `
  );

  return {
    range,
    users: { total: totalUsers, newInPeriod: startDate ? newInPeriod : totalUsers },
    study: { activePlans, completedPlans, rescheduleCount },
    social: { acceptedPartners, totalGroups, activeMemberships, conversations, messages },
    ai: { total: aiTotal, byType: aiByType },
    notifications: { total: notifTotal, read: notifRead, byType: notifByType },
    newUsersByDay,
  };
}