"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { calculateMatchScore, rankCandidates } from "@/lib/matching";
import {
  partnerFiltersSchema,
  sendPartnerRequestSchema,
  partnerRequestActionSchema,
} from "@/lib/validations/partners";
import type {
  PartnerFilters,
  PartnerCandidate,
  PartnerFilterOptions,
  PublicPartnerProfile,
  MyPartnersData,
  PartnerRequestWithUser,
  MatchingProfile,
} from "@/types/partner";
import { Gender, UsmleStage } from "@prisma/client";

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

function auth() {
  return getServerSession(authOptions);
}

const EMPTY_PROFILE: MatchingProfile = {
  currentSystemId: null,
  currentChapterId: null,
  preferredStudyTime: null,
  academicYear: null,
  preferredStudyLocationId: null,
  currentUsmleStage: null,
  gender: null,
};

async function getUserProfile(userId: string) {
  return db.profile.findUnique({
    where: { userId },
    select: {
      currentSystemId: true,
      currentChapterId: true,
      preferredStudyTime: true,
      academicYear: true,
      preferredStudyLocationId: true,
      currentUsmleStage: true,
      gender: true,
    },
  });
}

function toMatchingProfile(
  p: {
    currentSystemId: string | null;
    currentChapterId: string | null;
    preferredStudyTime: string | null;
    academicYear: string | null;
    preferredStudyLocationId: string | null;
    currentUsmleStage: string | null;
    gender: string | null;
  } | null
): MatchingProfile {
  if (!p) return EMPTY_PROFILE;
  return {
    currentSystemId: p.currentSystemId,
    currentChapterId: p.currentChapterId,
    preferredStudyTime: p.preferredStudyTime,
    academicYear: p.academicYear,
    preferredStudyLocationId: p.preferredStudyLocationId,
    currentUsmleStage: p.currentUsmleStage,
    gender: p.gender,
  };
}

async function getExcludedUserIds(currentUserId: string): Promise<Set<string>> {
  const excluded = new Set<string>([currentUserId]);

  const relations = await db.studyPartnerRequest.findMany({
    where: {
      OR: [
        { senderId: currentUserId, status: { in: ["ACCEPTED", "PENDING"] } },
        { receiverId: currentUserId, status: { in: ["ACCEPTED", "PENDING"] } },
      ],
    },
    select: { senderId: true, receiverId: true },
  });

  for (const r of relations) {
    excluded.add(r.senderId);
    excluded.add(r.receiverId);
  }

  return excluded;
}

function buildCandidate(
  p: {
    userId: string;
    firstName: string | null;
    lastName: string | null;
    academicYear: string | null;
    gender: string | null;
    currentUsmleStage: string | null;
    currentSystemId: string | null;
    currentChapterId: string | null;
    preferredStudyTime: string | null;
    preferredStudyLocationId: string | null;
    currentSystem: { id: string; name: string } | null;
    currentChapter: { id: string; name: string } | null;
    preferredStudyLocation: { id: string; name: string } | null;
  },
  score: number,
  reasons: string[]
): PartnerCandidate {
  const first = p.firstName ?? "";
  const last = p.lastName ?? "";
  return {
    userId: p.userId,
    firstName: p.firstName,
    lastName: p.lastName,
    displayName: [first, last].filter(Boolean).join(" ") || "مستخدم",
    academicYear: p.academicYear,
    gender: p.gender,
    currentUsmleStage: p.currentUsmleStage,
    currentSystem: p.currentSystem,
    currentChapter: p.currentChapter,
    preferredStudyTime: p.preferredStudyTime,
    preferredStudyLocation: p.preferredStudyLocation,
    matchScore: score,
    matchReasons: reasons,
  };
}

// ═══════════════════════════════════════════════════════════
//  FILTER OPTIONS
// ═══════════════════════════════════════════════════════════

export async function getPartnerFilterOptions(): Promise<PartnerFilterOptions> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  const [systems, chapters, locations, yearRows] = await Promise.all([
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
    db.profile.findMany({
      select: { academicYear: true },
      distinct: ["academicYear"],
      where: { academicYear: { not: null } },
      orderBy: { academicYear: "asc" },
    }),
  ]);

  return {
    systems,
    chapters,
    locations,
    academicYears: yearRows
      .map((y) => y.academicYear)
      .filter((y): y is string => y !== null),
  };
}

// ═══════════════════════════════════════════════════════════
//  SEARCH MATCHES
// ═══════════════════════════════════════════════════════════

export async function searchPartnerMatches(
  rawFilters: PartnerFilters
): Promise<{ candidates: PartnerCandidate[]; appliedFilters: string[] }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  const filters = partnerFiltersSchema.parse(rawFilters);
  const currentUserId = session.user.id;
  const excludedIds = await getExcludedUserIds(currentUserId);
  const userProfile = await getUserProfile(currentUserId);
  const userMatch = toMatchingProfile(userProfile);

  const whereClause: Record<string, unknown> = {
    userId: { not: currentUserId, notIn: Array.from(excludedIds) },
  };

  if (filters.systemId) whereClause.currentSystemId = filters.systemId;
  if (filters.chapterId) whereClause.currentChapterId = filters.chapterId;
  if (filters.gender) whereClause.gender = filters.gender as Gender;
  if (filters.academicYear) whereClause.academicYear = filters.academicYear;
  if (filters.usmleStage)
    whereClause.currentUsmleStage = filters.usmleStage as UsmleStage;

  const candidates = await db.profile.findMany({
    where: whereClause,
    select: {
      userId: true,
      firstName: true,
      lastName: true,
      academicYear: true,
      gender: true,
      currentUsmleStage: true,
      currentSystemId: true,
      currentChapterId: true,
      preferredStudyTime: true,
      preferredStudyLocationId: true,
      currentSystem: { select: { id: true, name: true } },
      currentChapter: { select: { id: true, name: true } },
      preferredStudyLocation: { select: { id: true, name: true } },
    },
    take: 200,
  });

  const scored = candidates.map((c) => {
    const result = calculateMatchScore(userMatch, toMatchingProfile(c));
    return buildCandidate(c, result.score, result.reasons);
  });

  const ranked = rankCandidates(scored);

  const appliedFilters = Object.entries(filters)
    .filter(([, v]) => v)
    .map(([k]) => k);

  return { candidates: ranked, appliedFilters };
}

// ═══════════════════════════════════════════════════════════
//  SMART MATCH
// ═══════════════════════════════════════════════════════════

export async function getSmartPartnerMatches(): Promise<{
  candidates: PartnerCandidate[];
}> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  const currentUserId = session.user.id;
  const userProfile = await getUserProfile(currentUserId);
  const userMatch = toMatchingProfile(userProfile);
  const excludedIds = await getExcludedUserIds(currentUserId);

  const orConditions: Record<string, unknown>[] = [];
  if (userProfile?.currentSystemId) {
    orConditions.push({ currentSystemId: userProfile.currentSystemId });
  }
  if (userProfile?.academicYear) {
    orConditions.push({ academicYear: userProfile.academicYear });
  }
  if (userProfile?.currentUsmleStage) {
    orConditions.push({ currentUsmleStage: userProfile.currentUsmleStage });
  }

  const whereClause: Record<string, unknown> = {
    userId: { not: currentUserId, notIn: Array.from(excludedIds) },
  };

  if (orConditions.length > 0) {
    whereClause.OR = orConditions;
  }

  const candidates = await db.profile.findMany({
    where: whereClause,
    select: {
      userId: true,
      firstName: true,
      lastName: true,
      academicYear: true,
      gender: true,
      currentUsmleStage: true,
      currentSystemId: true,
      currentChapterId: true,
      preferredStudyTime: true,
      preferredStudyLocationId: true,
      currentSystem: { select: { id: true, name: true } },
      currentChapter: { select: { id: true, name: true } },
      preferredStudyLocation: { select: { id: true, name: true } },
    },
    take: 200,
  });

  const scored = candidates.map((c) => {
    const result = calculateMatchScore(userMatch, toMatchingProfile(c));
    return buildCandidate(c, result.score, result.reasons);
  });

  return { candidates: rankCandidates(scored) };
}

// ═══════════════════════════════════════════════════════════
//  PARTNER PROFILE
// ═══════════════════════════════════════════════════════════

export async function getPartnerProfile(
  targetUserId: string
): Promise<PublicPartnerProfile | null> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  if (session.user.id === targetUserId) throw new Error("لا يمكنك عرض بروفايلك");

  const profile = await db.profile.findUnique({
    where: { userId: targetUserId },
    select: {
      firstName: true,
      lastName: true,
      academicYear: true,
      gender: true,
      currentUsmleStage: true,
      currentSystemId: true,
      currentChapterId: true,
      preferredStudyTime: true,
      preferredStudyLocationId: true,
      bio: true,
      currentSystem: { select: { id: true, name: true } },
      currentChapter: { select: { id: true, name: true } },
      preferredStudyLocation: { select: { id: true, name: true } },
    },
  });

  if (!profile) return null;

  const first = profile.firstName ?? "";
  const last = profile.lastName ?? "";

  const userProfile = await getUserProfile(session.user.id);
  const match = calculateMatchScore(
    toMatchingProfile(userProfile),
    toMatchingProfile(profile)
  );

  return {
    displayName: [first, last].filter(Boolean).join(" ") || "مستخدم",
    academicYear: profile.academicYear,
    gender: profile.gender,
    currentUsmleStage: profile.currentUsmleStage,
    currentSystem: profile.currentSystem,
    currentChapter: profile.currentChapter,
    preferredStudyTime: profile.preferredStudyTime,
    preferredStudyLocation: profile.preferredStudyLocation,
    bio: profile.bio,
    matchScore: match.score,
    matchReasons: match.reasons,
  };
}

// ═══════════════════════════════════════════════════════════
//  SEND REQUEST
// ═══════════════════════════════════════════════════════════

export async function sendPartnerRequest(candidateId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  sendPartnerRequestSchema.parse({ candidateId });
  const senderId = session.user.id;

  if (senderId === candidateId) throw new Error("لا يمكنك إرسال طلب لنفسك");

  const candidate = await db.profile.findUnique({
    where: { userId: candidateId },
    select: { userId: true },
  });
  if (!candidate) throw new Error("المرشح غير موجود");

  const existingSameDir = await db.studyPartnerRequest.findUnique({
    where: { senderId_receiverId: { senderId, receiverId: candidateId } },
  });

  if (existingSameDir) {
    if (existingSameDir.status === "PENDING")
      throw new Error("لقد أرسلت طلباً بالفعل");
    if (existingSameDir.status === "ACCEPTED")
      throw new Error("أنتما شركاء بالفعل");

    const updated = await db.studyPartnerRequest.update({
      where: { id: existingSameDir.id },
      data: { status: "PENDING", message: null, createdAt: new Date() },
    });

    await db.notification.create({
      data: {
        userId: candidateId,
        type: "PARTNER_REQUEST",
        title: "طلب شراكة دراسية جديد",
        message: "أرسل لك طلب شراكة دراسية.",
        data: { senderId, requestId: updated.id },
      },
    });

    revalidatePath("/partners");
    revalidatePath("/partners/my");
    return { success: true, reactivated: true };
  }

  const existingReverse = await db.studyPartnerRequest.findUnique({
    where: {
      senderId_receiverId: { senderId: candidateId, receiverId: senderId },
    },
  });

  if (existingReverse) {
    if (existingReverse.status === "PENDING")
      throw new Error("أرسل لك هذا الشخص طلباً بالفعل — راجع الطلبات الواردة");
    if (existingReverse.status === "ACCEPTED")
      throw new Error("أنتما شركاء بالفعل");
  }

  const request = await db.studyPartnerRequest.create({
    data: { senderId, receiverId: candidateId },
  });

  const senderProfile = await db.profile.findUnique({
    where: { userId: senderId },
    select: { firstName: true, lastName: true },
  });
  const senderName =
    [senderProfile?.firstName, senderProfile?.lastName]
      .filter(Boolean)
      .join(" ") || "مستخدم";

  await db.notification.create({
    data: {
      userId: candidateId,
      type: "PARTNER_REQUEST",
      title: "طلب شراكة دراسية جديد",
      message: `${senderName} أرسل لك طلب شراكة دراسية.`,
      data: { senderId, requestId: request.id },
    },
  });

  revalidatePath("/partners");
  revalidatePath("/partners/my");
  return { success: true, reactivated: false };
}

// ═══════════════════════════════════════════════════════════
//  ACCEPT / REJECT / CANCEL
// ═══════════════════════════════════════════════════════════

export async function acceptPartnerRequest(requestId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  partnerRequestActionSchema.parse({ requestId });
  const userId = session.user.id;

  const request = await db.studyPartnerRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error("الطلب غير موجود");
  if (request.receiverId !== userId) throw new Error("لست مستلم هذا الطلب");
  if (request.status !== "PENDING") throw new Error("الطلب ليس قيد الانتظار");

  await db.studyPartnerRequest.update({
    where: { id: requestId },
    data: { status: "ACCEPTED" },
  });

  const accepterProfile = await db.profile.findUnique({
    where: { userId },
    select: { firstName: true, lastName: true },
  });
  const accepterName =
    [accepterProfile?.firstName, accepterProfile?.lastName]
      .filter(Boolean)
      .join(" ") || "مستخدم";

  await db.notification.create({
    data: {
      userId: request.senderId,
      type: "PARTNER_ACCEPTED",
      title: "تم قبول طلب الشراكة",
      message: `${accepterName} قبل طلب الشراكة الدراسية.`,
      data: { receiverId: userId, requestId },
    },
  });

  revalidatePath("/partners/my");
  return { success: true };
}

export async function rejectPartnerRequest(requestId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  partnerRequestActionSchema.parse({ requestId });

  const request = await db.studyPartnerRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error("الطلب غير موجود");
  if (request.receiverId !== session.user.id)
    throw new Error("لست مستلم هذا الطلب");
  if (request.status !== "PENDING") throw new Error("الطلب ليس قيد الانتظار");

  await db.studyPartnerRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED" },
  });

  revalidatePath("/partners/my");
  return { success: true };
}

export async function cancelPartnerRequest(requestId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  partnerRequestActionSchema.parse({ requestId });

  const request = await db.studyPartnerRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error("الطلب غير موجود");
  if (request.senderId !== session.user.id)
    throw new Error("لست مرسل هذا الطلب");
  if (request.status !== "PENDING") throw new Error("الطلب ليس قيد الانتظار");

  await db.studyPartnerRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/partners/my");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
//  MY PARTNERS
// ═══════════════════════════════════════════════════════════

interface RawProfile {
  firstName: string | null;
  lastName: string | null;
  academicYear: string | null;
  currentUsmleStage: string | null;
  currentSystem: { id: string; name: string } | null;
  currentChapter: { id: string; name: string } | null;
}

function safeDisplayName(p: RawProfile | null): string {
  if (!p) return "مستخدم";
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || "مستخدم";
}

export async function getMyPartnerRequests(): Promise<MyPartnersData> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  const userId = session.user.id;

  const requests = await db.studyPartnerRequest.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: {
      id: true,
      senderId: true,
      receiverId: true,
      message: true,
      status: true,
      createdAt: true,
      sender: {
        select: {
          id: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              academicYear: true,
              currentUsmleStage: true,
              currentSystem: { select: { id: true, name: true } },
              currentChapter: { select: { id: true, name: true } },
            },
          },
        },
      },
      receiver: {
        select: {
          id: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              academicYear: true,
              currentUsmleStage: true,
              currentSystem: { select: { id: true, name: true } },
              currentChapter: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  function mapRequest(r: (typeof requests)[0]): PartnerRequestWithUser {
    const isSender = r.senderId === userId;
    const other = isSender ? r.receiver : r.sender;
    const otherProfile = isSender ? r.receiver.profile : r.sender.profile;

    return {
      id: r.id,
      senderId: r.senderId,
      receiverId: r.receiverId,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      otherUser: {
        userId: other.id,
        displayName: safeDisplayName(otherProfile),
        academicYear: otherProfile?.academicYear ?? null,
        currentUsmleStage: otherProfile?.currentUsmleStage ?? null,
        currentSystem: otherProfile?.currentSystem ?? null,
        currentChapter: otherProfile?.currentChapter ?? null,
      },
    };
  }

  const incoming: PartnerRequestWithUser[] = [];
  const outgoing: PartnerRequestWithUser[] = [];
  const accepted: PartnerRequestWithUser[] = [];

  for (const r of requests) {
    const mapped = mapRequest(r);
    if (r.status === "PENDING" && r.receiverId === userId) incoming.push(mapped);
    else if (r.status === "PENDING" && r.senderId === userId) outgoing.push(mapped);
    else if (r.status === "ACCEPTED") accepted.push(mapped);
  }

  return { incoming, outgoing, accepted };
}