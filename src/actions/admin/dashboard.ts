"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "./common";
import type { DashboardStats } from "@/types/admin";

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdmin();

  const [
    totalUsers,
    newUsers,
    activePlans,
    completedPlans,
    totalPartners,
    totalGroups,
    totalMessages,
    totalNotifications,
    unreadNotifications,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
    }),                                                              // ← كان ناقص ) هنا
    db.studyPlan.count({ where: { status: "ACTIVE" } }),
    db.studyPlan.count({ where: { status: "COMPLETED" } }),
    db.studyPartnerRequest.count({ where: { status: "ACCEPTED" } }),
    db.studyGroup.count(),
    db.message.count(),
    db.notification.count(),
    db.notification.count({ where: { isRead: false } }),
  ]);

  return {
    totalUsers,
    newUsers,
    activePlans,
    completedPlans,
    totalPartners,
    totalGroups,
    totalMessages,
    totalNotifications,
    unreadNotifications,
  };
}