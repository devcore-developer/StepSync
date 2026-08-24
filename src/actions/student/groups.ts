"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { calculateGroupMatchScore } from "@/lib/group-matching";
import {
  createGroupSchema,
  updateGroupSchema,
  groupFiltersSchema,
  groupIdSchema,
  membershipIdSchema,
} from "@/lib/validations/groups";
import type {
  StudyGroupSummary,
  StudyGroupDetails,
  GroupMemberInfo,
  GroupFilters,
  GroupFormOptions,
} from "@/types/groups";
import { createNotification } from "@/lib/notifications";
function auth() {
  return getServerSession(authOptions);
}

function dn(p: {
  firstName: string | null;
  lastName: string | null;
} | null): string {
  if (!p) return "مستخدم";
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || "مستخدم";
}

// ═══════════════════════════════════════════════════════════
//  FORM OPTIONS
// ═══════════════════════════════════════════════════════════

export async function getGroupFormOptions(): Promise<GroupFormOptions> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  const [systems, chapters, locations] = await Promise.all([
    db.usmleSystem.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { order: "asc" },
    }),
    db.chapter.findMany({
      where: { isActive: true },
      select: { id: true, name: true, systemId: true },
      orderBy: { order: "asc" },
    }),
    db.studyLocation.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { systems, chapters, locations };
}

// ═══════════════════════════════════════════════════════════
//  CREATE — ✅ FIX #7: added chapter-belongs-to-system validation
// ═══════════════════════════════════════════════════════════

export async function createStudyGroup(raw: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  const userId = session.user.id;

  const data = createGroupSchema.parse(raw);

  // ✅ FIX #7: تحقق إن الفصل ينتمي للنظام
  if (data.currentChapterId && data.currentSystemId) {
    const chapter = await db.chapter.findUnique({
      where: { id: data.currentChapterId },
      select: { systemId: true },
    });
    if (!chapter) throw new Error("الفصل غير موجود");
    if (chapter.systemId !== data.currentSystemId)
      throw new Error("الفصل لا ينتمي للنظام المحدد");
  } else if (data.currentChapterId) {
    throw new Error("يجب اختيار النظام أولاً قبل اختيار الفصل");
  }

  const group = await db.$transaction(async (tx) => {
    const g = await tx.studyGroup.create({
      data: {
        name: data.name,
        description: data.description || null,
        goal: data.goal || null,
        visibility: data.visibility,
        currentSystemId: data.currentSystemId || null,
        currentChapterId: data.currentChapterId || null,
        studyLocationId: data.studyLocationId || null,
        preferredStudyTime: data.preferredStudyTime || null,
        maxMembers: data.maxMembers ?? null,
      },
    });

    await tx.groupMember.create({
      data: {
        groupId: g.id,
        userId,
        role: "OWNER",
        status: "ACTIVE",
        joinedAt: new Date(),
      },
    });

    return g;
  });

  revalidatePath("/groups");
  revalidatePath("/groups/my");
  return { groupId: group.id };
}

// ═══════════════════════════════════════════════════════════
//  UPDATE — ✅ FIX #8: added chapter-belongs-to-system validation
// ═══════════════════════════════════════════════════════════

export async function updateStudyGroup(groupId: string, raw: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  groupIdSchema.parse({ groupId });

  const data = updateGroupSchema.parse(raw);
  const userId = session.user.id;

  const membership = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { role: true, status: true },
  });

  if (!membership || membership.status !== "ACTIVE")
    throw new Error("لست عضواً في هذه المجموعة");
  if (membership.role === "MEMBER")
    throw new Error("الأعضاء العاديون لا يمكنهم تعديل المجموعة");

  // ✅ FIX #8: تحقق إن الفصل ينتمي للنظام
  if (data.currentChapterId && data.currentSystemId) {
    const chapter = await db.chapter.findUnique({
      where: { id: data.currentChapterId },
      select: { systemId: true },
    });
    if (!chapter) throw new Error("الفصل غير موجود");
    if (chapter.systemId !== data.currentSystemId)
      throw new Error("الفصل لا ينتمي للنظام المحدد");
  } else if (data.currentChapterId && !data.currentSystemId) {
    // لو الفصل اختير بدون نظام، نتحقق من النظام الحالي للمجموعة
    const currentGroup = await db.studyGroup.findUnique({
      where: { id: groupId },
      select: { currentSystemId: true },
    });
    if (currentGroup?.currentSystemId) {
      const chapter = await db.chapter.findUnique({
        where: { id: data.currentChapterId },
        select: { systemId: true },
      });
      if (chapter && chapter.systemId !== currentGroup.currentSystemId)
        throw new Error("الفصل لا ينتمي للنظام الحالي للمجموعة");
    }
  }

  await db.studyGroup.update({
    where: { id: groupId, status: "ACTIVE" },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && {
        description: data.description || null,
      }),
      ...(data.goal !== undefined && { goal: data.goal || null }),
      ...(data.visibility && { visibility: data.visibility }),
      ...(data.currentSystemId !== undefined && {
        currentSystemId: data.currentSystemId || null,
      }),
      ...(data.currentChapterId !== undefined && {
        currentChapterId: data.currentChapterId || null,
      }),
      ...(data.studyLocationId !== undefined && {
        studyLocationId: data.studyLocationId || null,
      }),
      ...(data.preferredStudyTime !== undefined && {
        preferredStudyTime: data.preferredStudyTime || null,
      }),
      ...(data.maxMembers !== undefined && { maxMembers: data.maxMembers }),
    },
  });

  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/settings`);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
//  ARCHIVE
// ═══════════════════════════════════════════════════════════

export async function archiveStudyGroup(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  groupIdSchema.parse({ groupId });

  const membership = await db.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: session.user.id },
    },
    select: { role: true, status: true },
  });

  if (!membership || membership.role !== "OWNER")
    throw new Error("فقط المالك يمكنه أرشفة المجموعة");

  await db.studyGroup.update({
    where: { id: groupId },
    data: { status: "ARCHIVED" },
  });

  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups/my");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
//  DELETE (permanent)
// ═══════════════════════════════════════════════════════════

export async function deleteGroup(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  groupIdSchema.parse({ groupId });

  const membership = await db.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: session.user.id },
    },
    select: { role: true },
  });

  if (!membership || membership.role !== "OWNER")
    throw new Error("فقط المالك يمكنه حذف المجموعة");

  await db.studyGroup.delete({
    where: { id: groupId },
  });

  revalidatePath("/groups");
  revalidatePath("/groups/my");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
//  GET GROUP (with owner info)
// ═══════════════════════════════════════════════════════════

export async function getStudyGroup(
  groupId: string
): Promise<StudyGroupDetails | null> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  groupIdSchema.parse({ groupId });

  const group = await db.studyGroup.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      description: true,
      goal: true,
      visibility: true,
      status: true,
      currentSystemId: true,
      currentChapterId: true,
      studyLocationId: true,
      preferredStudyTime: true,
      maxMembers: true,
      createdAt: true,
      currentSystem: { select: { id: true, name: true } },
      currentChapter: { select: { id: true, name: true } },
      studyLocation: { select: { id: true, name: true } },
      _count: {
        select: { members: { where: { status: "ACTIVE" } } },
      },
    },
  });

  if (!group) return null;

  if (group.visibility === "PRIVATE") {
    const membership = await db.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId: session.user.id },
      },
      select: { role: true, status: true },
    });
    if (!membership) return null;
  }

  const membership = await db.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: session.user.id },
    },
    select: { id: true, role: true, status: true },
  });

  const ownerMember = await db.groupMember.findFirst({
    where: { groupId, role: "OWNER", status: "ACTIVE" },
    select: {
      user: {
        select: {
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    visibility: group.visibility,
    status: group.status,
    memberCount: group._count.members,
    maxMembers: group.maxMembers,
    currentSystem: group.currentSystem,
    currentChapter: group.currentChapter,
    studyLocation: group.studyLocation,
    createdAt: group.createdAt.toISOString(),
    goal: group.goal,
    preferredStudyTime: group.preferredStudyTime,
    ownerName: dn(ownerMember?.user?.profile ?? null),
    membershipState: {
      isMember: membership?.status === "ACTIVE",
      isOwner: membership?.role === "OWNER",
      isAdmin: membership?.role === "ADMIN",
      isPending: membership?.status === "PENDING",
      isBanned: membership?.status === "BANNED",
      membershipId: membership?.id ?? null,
    },
    userRole: membership?.role ?? null,
  };
}

// ═══════════════════════════════════════════════════════════
//  MY GROUPS
// ═══════════════════════════════════════════════════════════

export async function getMyGroups() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  const memberships = await db.groupMember.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      role: true,
      status: true,
      joinedAt: true,
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          visibility: true,
          status: true,
          maxMembers: true,
          currentSystem: { select: { id: true, name: true } },
          currentChapter: { select: { id: true, name: true } },
          studyLocation: { select: { id: true, name: true } },
          _count: {
            select: { members: { where: { status: "ACTIVE" } } },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return {
    owned: memberships.filter(
      (m) => m.role === "OWNER" && m.status === "ACTIVE"
    ),
    admin: memberships.filter(
      (m) => m.role === "ADMIN" && m.status === "ACTIVE"
    ),
    member: memberships.filter(
      (m) => m.role === "MEMBER" && m.status === "ACTIVE"
    ),
    pending: memberships.filter((m) => m.status === "PENDING"),
  };
}

// ═══════════════════════════════════════════════════════════
//  DISCOVER
// ═══════════════════════════════════════════════════════════

export async function discoverGroups(
  raw: unknown
): Promise<StudyGroupSummary[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  const filters = groupFiltersSchema.parse(raw);

  const where: Record<string, unknown> = { status: "ACTIVE" };

  if (filters.systemId) where.currentSystemId = filters.systemId;
  if (filters.chapterId) where.currentChapterId = filters.chapterId;
  if (filters.visibility) where.visibility = filters.visibility;
  if (filters.locationId) where.studyLocationId = filters.locationId;
  if (filters.search)
    where.name = { contains: filters.search, mode: "insensitive" };

  const banned = await db.groupMember.findMany({
    where: { userId: session.user.id, status: "BANNED" },
    select: { groupId: true },
  });
  if (banned.length > 0) {
    where.id = { notIn: banned.map((b) => b.groupId) };
  }

  const groups = await db.studyGroup.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      visibility: true,
      status: true,
      maxMembers: true,
      currentSystem: { select: { id: true, name: true } },
      currentChapter: { select: { id: true, name: true } },
      studyLocation: { select: { id: true, name: true } },
      _count: {
        select: { members: { where: { status: "ACTIVE" } } },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 25,
  });

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    visibility: g.visibility,
    status: g.status,
    memberCount: g._count.members,
    maxMembers: g.maxMembers,
    currentSystem: g.currentSystem,
    currentChapter: g.currentChapter,
    studyLocation: g.studyLocation,
  }));
}

// ═══════════════════════════════════════════════════════════
//  RECOMMENDED
// ═══════════════════════════════════════════════════════════

export async function getRecommendedGroups(): Promise<StudyGroupSummary[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  const profile = await db.profile.findUnique({
    where: { userId: session.user.id },
    select: {
      currentSystemId: true,
      currentChapterId: true,
      preferredStudyLocationId: true,
    },
  });

  const groups = await db.studyGroup.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      description: true,
      visibility: true,
      status: true,
      maxMembers: true,
      currentSystemId: true,
      currentChapterId: true,
      studyLocationId: true,
      currentSystem: { select: { id: true, name: true } },
      currentChapter: { select: { id: true, name: true } },
      studyLocation: { select: { id: true, name: true } },
      _count: {
        select: { members: { where: { status: "ACTIVE" } } },
      },
    },
    take: 100,
  });

  const scored = groups
    .map((g) => {
      const result = calculateGroupMatchScore(
        profile ?? {
          currentSystemId: null,
          currentChapterId: null,
          preferredStudyLocationId: null,
        },
        {
          currentSystemId: g.currentSystemId,
          currentChapterId: g.currentChapterId,
          studyLocationId: g.studyLocationId,
          memberCount: g._count.members,
          maxMembers: g.maxMembers,
        }
      );
      return {
        id: g.id,
        name: g.name,
        description: g.description,
        visibility: g.visibility,
        status: g.status,
        memberCount: g._count.members,
        maxMembers: g.maxMembers,
        currentSystem: g.currentSystem,
        currentChapter: g.currentChapter,
        studyLocation: g.studyLocation,
        matchScore: result.score,
        matchReasons: result.reasons,
      };
    })
    .filter((g) => g.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

  return scored;
}

// ═══════════════════════════════════════════════════════════
//  JOIN PUBLIC — ✅ FIX #5: wrapped in transaction for capacity race condition
// ═══════════════════════════════════════════════════════════

export async function joinPublicGroup(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  groupIdSchema.parse({ groupId });
  const userId = session.user.id;

  const group = await db.studyGroup.findUnique({
    where: { id: groupId, status: "ACTIVE" },
    select: { visibility: true, maxMembers: true, name: true },
  });
  if (!group) throw new Error("المجموعة غير موجودة");
  if (group.visibility !== "PUBLIC")
    throw new Error("هذه المجموعة خاصة — يجب تقديم طلب");

  const existing = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (existing) {
    if (existing.status === "ACTIVE") throw new Error("أنت بالفعل عضو");
    if (existing.status === "PENDING") throw new Error("طلبك قيد المراجعة");
    if (existing.status === "BANNED") throw new Error("تم حظرك من هذه المجموعة");
  }

  // ✅ FIX #5: transaction يمنع race condition في السعة
  await db.$transaction(async (tx) => {
    if (group.maxMembers) {
      const count = await tx.groupMember.count({
        where: { groupId, status: "ACTIVE" },
      });
      if (count >= group.maxMembers) throw new Error("المجموعة ممتلئة");
    }

    await tx.groupMember.create({
      data: {
        groupId,
        userId,
        role: "MEMBER",
        status: "ACTIVE",
        joinedAt: new Date(),
      },
    });
  });

  const ownerMembership = await db.groupMember.findFirst({
    where: { groupId, role: "OWNER", status: "ACTIVE" },
    select: { userId: true },
  });

  if (ownerMembership && ownerMembership.userId !== userId) {
    await createNotification({
        userId: ownerMembership.userId,
        type: "GROUP_INVITE",
        title: "عضو جديد",
        message: `انضم عضو جديد إلى المجموعة "${group.name}".`,
        data: { groupId },
    });
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups/my");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
//  REQUEST TO JOIN (private) — ✅ FIX #1: was rejecting PRIVATE groups
// ═══════════════════════════════════════════════════════════

export async function requestToJoinGroup(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  groupIdSchema.parse({ groupId });
  const userId = session.user.id;

  const group = await db.studyGroup.findUnique({
    where: { id: groupId, status: "ACTIVE" },
    select: { visibility: true, name: true },
  });
  if (!group) throw new Error("المجموعة غير موجودة");

  // ✅ FIX #1: كان !== "PUBLIC" (يرفض المجموعات الخاصة!)
  // الآن: !== "PRIVATE" (يرفض المجموعات العامة — صح لأن الفانكشن دي للخاصة فقط)
  if (group.visibility !== "PRIVATE")
    throw new Error("هذه المجموعة عامة — انضم مباشرة");

  const existing = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (existing) throw new Error("يوجد طلب أو عضوية سابقة");

  const member = await db.groupMember.create({
    data: { groupId, userId, role: "MEMBER", status: "PENDING" },
  });

  const owners = await db.groupMember.findMany({
    where: { groupId, role: { in: ["OWNER", "ADMIN"] }, status: "ACTIVE" },
    select: { userId: true },
  });

  for (const o of owners) {
    await createNotification({
        userId: o.userId,
        type: "JOIN_REQUEST",
        title: "طلب انضمام جديد",
        message: `طلب انضمام جديد إلى "${group.name}".`,
        data: { groupId, membershipId: member.id },
    });
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups/my");
  return { success: true, membershipId: member.id };
}

// ═══════════════════════════════════════════════════════════
//  CANCEL JOIN REQUEST
// ═══════════════════════════════════════════════════════════

export async function cancelJoinRequest(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  groupIdSchema.parse({ groupId });
  const userId = session.user.id;

  const membership = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!membership || membership.status !== "PENDING")
    throw new Error("لا يوجد طلب معلق لإلغائه");

  await db.groupMember.update({
    where: { id: membership.id },
    data: { status: "CANCELLED" },
  });

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups/my");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
//  APPROVE — ✅ FIX #6: transaction for capacity race condition
// ═══════════════════════════════════════════════════════════

export async function approveJoinRequest(membershipId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  membershipIdSchema.parse({ membershipId });
  const userId = session.user.id;

  const membership = await db.groupMember.findUnique({
    where: { id: membershipId },
    include: {
      group: {
        select: { id: true, name: true, status: true, maxMembers: true },
      },
    },
  });

  if (!membership) throw new Error("العضوية غير موجودة");

  const myMembership = await db.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: membership.groupId, userId },
    },
    select: { role: true, status: true },
  });
  if (
    !myMembership ||
    myMembership.status !== "ACTIVE" ||
    (myMembership.role !== "OWNER" && myMembership.role !== "ADMIN")
  )
    throw new Error("ليس لديك صلاحية");

  if (membership.status !== "PENDING")
    throw new Error("الطلب ليس قيد المراجعة");
  if (membership.group.status !== "ACTIVE")
    throw new Error("المجموعة غير نشطة");

  // ✅ FIX #6: transaction يمنع race condition
  await db.$transaction(async (tx) => {
    if (membership.group.maxMembers) {
      const count = await tx.groupMember.count({
        where: { groupId: membership.groupId, status: "ACTIVE" },
      });
      if (count >= membership.group.maxMembers)
        throw new Error("المجموعة ممتلئة");
    }

    await tx.groupMember.update({
      where: { id: membershipId },
      data: { status: "ACTIVE", joinedAt: new Date() },
    });
  });

  await createNotification({
      userId: membership.userId,
      type: "JOIN_ACCEPTED",
      title: "تم قبول طلبك",
      message: `تم قبول انضمامك إلى "${membership.group.name}".`,
      data: { groupId: membership.groupId },
  });

  revalidatePath(`/groups/${membership.groupId}/members`);
  revalidatePath(`/groups/${membership.groupId}/manage`);
  return { success: true };
}

export async function rejectJoinRequest(membershipId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  membershipIdSchema.parse({ membershipId });

  const membership = await db.groupMember.findUnique({
    where: { id: membershipId },
    include: { group: { select: { id: true, name: true } } },
  });

  if (!membership || membership.status !== "PENDING")
    throw new Error("الطلب غير موجود");

  const myMembership = await db.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: membership.groupId, userId: session.user.id },
    },
    select: { role: true, status: true },
  });
  if (
    !myMembership ||
    myMembership.status !== "ACTIVE" ||
    (myMembership.role !== "OWNER" && myMembership.role !== "ADMIN")
  )
    throw new Error("ليس لديك صلاحية");

  await db.groupMember.update({
    where: { id: membershipId },
    data: { status: "REJECTED" },
  });

  await createNotification({
      userId: membership.userId,
      type: "JOIN_REJECTED",
      title: "تم رفض طلبك",
      message: `تم رفض انضمامك إلى "${membership.group.name}".`,
      data: { groupId: membership.groupId },
  });

  revalidatePath(`/groups/${membership.groupId}/members`);
  revalidatePath(`/groups/${membership.groupId}/manage`);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
//  LEAVE
// ═══════════════════════════════════════════════════════════

export async function leaveGroup(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  groupIdSchema.parse({ groupId });
  const userId = session.user.id;

  const membership = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true, role: true, status: true },
  });

  if (!membership || membership.status !== "ACTIVE")
    throw new Error("لست عضواً نشطاً");
  if (membership.role === "OWNER")
    throw new Error("المالك لا يمكنه المغادرة — نقل الملكية أولاً");

  await db.groupMember.update({
    where: { id: membership.id },
    data: { status: "LEFT", role: "MEMBER" },
  });

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups/my");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
//  REMOVE MEMBER — ✅ FIX #2: notification type GROUP_INVITE → GROUP_MEMBER_REMOVED
// ═══════════════════════════════════════════════════════════

export async function removeMember(membershipId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  membershipIdSchema.parse({ membershipId });

  const target = await db.groupMember.findUnique({
    where: { id: membershipId },
    select: {
      userId: true,
      groupId: true,
      role: true,
      status: true,
    },
  });

  if (!target || target.status !== "ACTIVE")
    throw new Error("العضو غير موجود");
  if (target.userId === session.user.id)
    throw new Error("لا يمكنك إزالة نفسك");

  const myMembership = await db.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: target.groupId, userId: session.user.id },
    },
    select: { role: true, status: true },
  });

  if (!myMembership || myMembership.status !== "ACTIVE")
    throw new Error("ليس لديك صلاحية");
  if (myMembership.role === "MEMBER")
    throw new Error("الأعضاء لا يمكنهم إزالة أعضاء");
  if (target.role === "OWNER")
    throw new Error("لا يمكن إزالة المالك");

  await db.groupMember.update({
    where: { id: membershipId },
    data: { status: "REMOVED", role: "MEMBER" },
  });

  // ✅ FIX #2: كان GROUP_INVITE (خطأ) → GROUP_MEMBER_REMOVED (صح)
  await createNotification({
      userId: target.userId,
      type: "GROUP_MEMBER_REMOVED",
      title: "تمت إزالتك من مجموعة",
      message: "تمت إزالتك من مجموعة دراسية.",
      data: { groupId: target.groupId },
  });

  revalidatePath(`/groups/${target.groupId}/members`);
  revalidatePath(`/groups/${target.groupId}/manage`);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
//  PROMOTE — ✅ FIX #3: OWNER only + notification type fix
// ═══════════════════════════════════════════════════════════

export async function promoteMember(membershipId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  membershipIdSchema.parse({ membershipId });

  const target = await db.groupMember.findUnique({
    where: { id: membershipId },
    select: {
      userId: true,
      groupId: true,
      role: true,
      status: true,
    },
  });

  if (!target || target.status !== "ACTIVE" || target.role !== "MEMBER")
    throw new Error("العضو غير موجود أو غير مؤهل للترقية");

  const myMembership = await db.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: target.groupId, userId: session.user.id },
    },
    select: { role: true, status: true },
  });

  // ✅ FIX #3a: كان role === "MEMBER" (يعني ADMIN يقدر يرقّي — غلط)
  // الآن: role !== "OWNER" (يعني OWNER فقط يقدر يرقّي — صح)
  if (
    !myMembership ||
    myMembership.status !== "ACTIVE" ||
    myMembership.role !== "OWNER"
  )
    throw new Error("فقط المالك يمكنه ترقية الأعضاء");

  await db.groupMember.update({
    where: { id: membershipId },
    data: { role: "ADMIN" },
  });

  // ✅ FIX #3b: كان GROUP_INVITE → GROUP_MEMBER_PROMOTED
  await createNotification({
      userId: target.userId,
      type: "GROUP_MEMBER_PROMOTED",
      title: "تمت ترقيتك",
      message: "أصبحت مشرفاً في مجموعة دراسية.",
      data: { groupId: target.groupId },
  });

  revalidatePath(`/groups/${target.groupId}/members`);
  revalidatePath(`/groups/${target.groupId}/manage`);
  return { success: true };
}

export async function demoteMember(membershipId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  membershipIdSchema.parse({ membershipId });

  const target = await db.groupMember.findUnique({
    where: { id: membershipId },
    select: {
      userId: true,
      groupId: true,
      role: true,
      status: true,
    },
  });

  if (!target || target.status !== "ACTIVE" || target.role !== "ADMIN")
    throw new Error("العضو غير موجود أو ليس مشرفاً");

  if (target.userId === session.user.id)
    throw new Error("لا يمكنك تغيير دورك");

  const myMembership = await db.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: target.groupId, userId: session.user.id },
    },
    select: { role: true, status: true },
  });

  if (!myMembership || myMembership.role !== "OWNER")
    throw new Error("فقط المالك يمكنه تخفيض مشرف");

  await db.groupMember.update({
    where: { id: membershipId },
    data: { role: "MEMBER" },
  });

  revalidatePath(`/groups/${target.groupId}/members`);
  revalidatePath(`/groups/${target.groupId}/manage`);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
//  TRANSFER OWNERSHIP — ✅ FIX #4: notification type fix
// ═══════════════════════════════════════════════════════════

export async function transferOwnership(membershipId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  membershipIdSchema.parse({ membershipId });

  const target = await db.groupMember.findUnique({
    where: { id: membershipId },
    select: {
      userId: true,
      groupId: true,
      role: true,
      status: true,
    },
  });

  if (!target || target.status !== "ACTIVE")
    throw new Error("العضو غير موجود");
  if (target.userId === session.user.id)
    throw new Error("لا يمكنك نقل الملكية لنفسك");

  const myMembership = await db.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: target.groupId, userId: session.user.id },
    },
    select: { role: true, status: true },
  });

  if (!myMembership || myMembership.role !== "OWNER")
    throw new Error("فقط المالك يمكنه نقل الملكية");

  await db.$transaction([
    db.groupMember.update({
      where: { id: membershipId },
      data: { role: "OWNER" },
    }),
    db.groupMember.update({
      where: {
        groupId_userId: {
          groupId: target.groupId,
          userId: session.user.id,
        },
      },
      data: { role: "ADMIN" },
    }),
  ]);

  // ✅ FIX #4: كان GROUP_INVITE → GROUP_MEMBER_PROMOTED
  await createNotification({
      userId: target.userId,
      type: "GROUP_MEMBER_PROMOTED",
      title: "تم نقل ملكية المجموعة",
      message: "أصبحت مالك مجموعة دراسية.",
      data: { groupId: target.groupId },
  });

  revalidatePath(`/groups/${target.groupId}`);
  revalidatePath(`/groups/${target.groupId}/members`);
  revalidatePath(`/groups/${target.groupId}/manage`);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
//  MEMBERS LIST
// ═══════════════════════════════════════════════════════════

export async function getGroupMembers(
  groupId: string
): Promise<GroupMemberInfo[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  groupIdSchema.parse({ groupId });

  const membership = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
    select: { status: true },
  });

  if (
    !membership ||
    (membership.status !== "ACTIVE" && membership.status !== "PENDING")
  )
    throw new Error("ليس لديك صلاحية");

  const members = await db.groupMember.findMany({
    where: { groupId },
    select: {
      id: true,
      userId: true,
      role: true,
      status: true,
      joinedAt: true,
      user: {
        select: {
          profile: {
            select: {
              firstName: true,
              lastName: true,
              academicYear: true,
              currentUsmleStage: true,
            },
          },
        },
      },
    },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  });

  return members.map((m) => ({
    membershipId: m.id,
    userId: m.userId,
    displayName: dn(m.user?.profile ?? null),
    role: m.role,
    status: m.status,
    joinedAt: m.joinedAt?.toISOString() ?? null,
    academicYear: m.user?.profile?.academicYear ?? null,
    currentUsmleStage: m.user?.profile?.currentUsmleStage ?? null,
  }));
}

// ═══════════════════════════════════════════════════════════
//  GROUP CONVERSATION — ✅ FIX #9: removed `as any`
// ═══════════════════════════════════════════════════════════

export async function getOrCreateGroupConversation(
  groupId: string
): Promise<{ conversationId: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  groupIdSchema.parse({ groupId });

  const membership = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
    select: { status: true },
  });

  if (!membership || membership.status !== "ACTIVE")
    throw new Error("لست عضواً نشطاً في هذه المجموعة");

  // ✅ FIX #9: شيلنا `as any` — لو طلع خطأ بعد prisma generate، رجّعها
  const convo = await db.conversation.findFirst({
    where: { groupId, type: "GROUP" },
    select: { id: true },
  });

  if (convo) {
    return { conversationId: convo.id };
  }

  const created = await db.conversation.create({
    data: { type: "GROUP", groupId },
  });

  const activeMembers = await db.groupMember.findMany({
    where: { groupId, status: "ACTIVE" },
    select: { userId: true },
  });
  if (activeMembers.length > 0) {
    await db.conversationMember.createMany({
      data: activeMembers.map((m) => ({
        conversationId: created.id,
        userId: m.userId,
      })),
    });
  }

  return { conversationId: created.id };
}