"use server";

import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "./common";
import { adminUserSearchSchema, adminRoleChangeSchema, adminUserIdSchema } from "@/lib/validations/admin";
import type { UserAdminRow, UserAdminDetails } from "@/types/admin";

export async function getUsers(raw: unknown) {
  await requireAdmin();
  const { search, role, onboarding, usmleStage, academicYear, page, limit } =
    adminUserSearchSchema.parse(raw);

  const where: Record<string, unknown> = {};

  if (search) where.email = { contains: search, mode: "insensitive" };
  if (role !== "ALL") where.role = role;

  if (usmleStage) {
    where.profile = { currentUsmleStage: usmleStage };
  }
  if (academicYear) {
    where.profile = { ...((where.profile as Record<string, unknown>) ?? {}), academicYear };
  }
  if (onboarding === "COMPLETE") {
    where.profile = { ...((where.profile as Record<string, unknown>) ?? {}), currentUsmleStage: { not: null } };
  } else if (onboarding === "INCOMPLETE") {
    where.profile = { ...((where.profile as Record<string, unknown>) ?? {}), currentUsmleStage: null };
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            currentUsmleStage: true,
            academicYear: true,
          },
        },
        _count: {
          select: {
            studyPlans: true,
            sentPartnerRequests: true,
            receivedPartnerRequests: true,
            groupMemberships: true,
            sentMessages: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.user.count({ where }),
  ]);

  const rows: UserAdminRow[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    isOnboarded: !!u.profile?.currentUsmleStage,
    usmleStage: u.profile?.currentUsmleStage ?? null,
    academicYear: u.profile?.academicYear ?? null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    _count: u._count,
  }));

  return { users: rows, total, page, limit };
}

export async function getUserDetails(raw: unknown): Promise<UserAdminDetails | null> {
  await requireAdmin();
  const { userId } = adminUserIdSchema.parse(raw);

  const user = await db.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    role: true,
    createdAt: true,
    updatedAt: true,

    profile: {
      select: {
        firstName: true,
        lastName: true,
        university: true,
        bio: true,
        gender: true,
        currentUsmleStage: true,
        academicYear: true,
        residenceArea: true,
      },
    },

    _count: {
      select: {
        studyPlans: true,
        sentPartnerRequests: true,
        receivedPartnerRequests: true,
        groupMemberships: true,
        sentMessages: true,
      },
    },
  },
});

  if (!user) return null;

  const aiCount = await db.aIRecommendation.count({
    where: { userId },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isOnboarded: !!user.profile?.currentUsmleStage,
      usmleStage: user.profile?.currentUsmleStage ?? null,
      academicYear: user.profile?.academicYear ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      _count: user._count,
    },
    profile: user.profile,
    planCount: user._count.studyPlans,
    activePlanCount: user._count.studyPlans,
    completedPlanCount: 0,
    groupCount: user._count.groupMemberships,
    partnerCount: user._count.sentPartnerRequests + user._count.receivedPartnerRequests,
    messageCount: user._count.sentMessages,
    aiRecommendationCount: aiCount,
  };
}

export async function changeUserRole(raw: unknown) {
  const admin = await requireAdmin();
  const { userId, role } = adminRoleChangeSchema.parse(raw);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true },
  });

  if (!user) throw new Error("المستخدم غير موجود");
  if (user.role === role) throw new Error("الدور هو نفسه بالفعل");

  await db.user.update({
    where: { id: userId },
    data: { role },
  });

  await logAdminAction({
    adminId: admin.id,
    action: "CHANGE_ROLE",
    targetType: "USER",
    targetId: userId,
    metadata: { fromRole: user.role, toRole: role },
  });

  return { success: true };
}