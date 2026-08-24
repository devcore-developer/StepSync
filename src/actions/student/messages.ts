"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import {
  sendMessageSchema,
  editMessageSchema,
  conversationIdSchema,
  partnerIdSchema,
  messageIdSchema,
} from "@/lib/validations/messages";
import type {
  ConversationPreview,
  ConversationDetail,
  MessageWithSender,
} from "@/types/messages";
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
//  GET MY CONVERSATIONS (Inbox)
// ═══════════════════════════════════════════════════════════

export async function getMyConversations(): Promise<ConversationPreview[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  const userId = session.user.id;

  const memberships = await db.conversationMember.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true },
  });

  const convoIds = memberships.map((m) => m.conversationId);
  if (convoIds.length === 0) return [];

  const conversations = await db.conversation.findMany({
    where: { id: { in: convoIds } },
    select: {
      id: true,
      type: true,
      participantA: true,
      participantB: true,
      groupId: true,
      updatedAt: true,
      participantAUser: {
        select: { profile: { select: { firstName: true, lastName: true } } },
      },
      participantBUser: {
        select: { profile: { select: { firstName: true, lastName: true } } },
      },
      group: {
        select: { id: true, name: true },
      },
      messages: {
        select: {
          content: true,
          deletedAt: true,
          senderId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      members: {
        where: { userId },
        select: { lastReadAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return conversations.map((conv) => {
    const lastRead = conv.members[0]?.lastReadAt ?? null;
    const lastMsg = conv.messages[0] ?? null;

    const isGroup = conv.type === "GROUP";

    if (isGroup && conv.group) {
      return {
        id: conv.id,
        partnerId: conv.group.id,
        partnerName: conv.group.name,
        isGroup: true,
        lastMessage: lastMsg
          ? lastMsg.deletedAt
            ? "تم حذف الرسالة"
            : lastMsg.content
          : null,
        lastMessageAt: lastMsg?.createdAt.toISOString() ?? null,
        hasUnread:
          !!lastMsg &&
          lastMsg.senderId !== userId &&
          !lastMsg.deletedAt &&
          (!lastRead || lastMsg.createdAt > lastRead),
      };
    }

    const isA = conv.participantA === userId;
    const partnerUser = isA ? conv.participantBUser : conv.participantAUser;
    const partnerId = isA ? conv.participantB! : conv.participantA!;

    return {
      id: conv.id,
      partnerId,
      partnerName: dn(partnerUser?.profile ?? null),
      isGroup: false,
      lastMessage: lastMsg
        ? lastMsg.deletedAt
          ? "تم حذف الرسالة"
          : lastMsg.content
        : null,
      lastMessageAt: lastMsg?.createdAt.toISOString() ?? null,
      hasUnread:
        !!lastMsg &&
        lastMsg.senderId !== userId &&
        !lastMsg.deletedAt &&
        (!lastRead || lastMsg.createdAt > lastRead),
    };
  });
}

// ═══════════════════════════════════════════════════════════
//  GET CONVERSATION (with messages)
// ═══════════════════════════════════════════════════════════

export async function getConversation(
  conversationId: string
): Promise<ConversationDetail | null> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  const userId = session.user.id;
  conversationIdSchema.parse({ conversationId });

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      type: true,
      participantA: true,
      participantB: true,
      groupId: true,
      participantAUser: {
        select: { profile: { select: { firstName: true, lastName: true } } },
      },
      participantBUser: {
        select: { profile: { select: { firstName: true, lastName: true } } },
      },
      group: { select: { id: true, name: true } },
    },
  });

  if (!conversation) return null;

  if (conversation.type === "DIRECT") {
    if (
      conversation.participantA !== userId &&
      conversation.participantB !== userId
    )
      return null;
  } else if (conversation.type === "GROUP") {
    if (!conversation.groupId) return null;
    const membership = await db.groupMember.findFirst({
      where: {
        groupId: conversation.groupId,
        userId,
        status: "ACTIVE",
      },
    });
    if (!membership) return null;
  }

  await db.conversationMember.updateMany({
    where: { conversationId, userId },
    data: { lastReadAt: new Date() },
  });

  const messages = await db.message.findMany({
    where: { conversationId },
    select: {
      id: true,
      content: true,
      deletedAt: true,
      editedAt: true,
      senderId: true,
      createdAt: true,
      sender: {
        select: {
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  messages.reverse();

  const isGroup = conversation.type === "GROUP";

  let partnerId: string;
  let partnerName: string;
  let memberCount: number | undefined;

  if (isGroup && conversation.group) {
    partnerId = conversation.group.id;
    partnerName = conversation.group.name;

    // ✅✅✅ تم الإصلاح الكامل هنا
    // كان: count({ const: findMany({ ... }); if (...) return null; })
    // الـ findMany + if كانوا محشورين جوه argument الـ count كـ properties
    // التحقق من العضوية موجود فوق بالفعل، فالمطلوب هنا بس عد الأعضاء
    memberCount = await db.groupMember.count({
    where: {
        groupId: conversation.group.id,
        status: "ACTIVE",
    },
    });
  } else {
    const isA = conversation.participantA === userId;
    const partnerUser = isA
      ? conversation.participantBUser
      : conversation.participantAUser;
    partnerId = isA ? conversation.participantB! : conversation.participantA!;
    partnerName = dn(partnerUser?.profile ?? null);
  }

  return {
    id: conversation.id,
    partnerId,
    partnerName,
    isGroup,
    memberCount,
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content,
      isDeleted: !!m.deletedAt,
      deletedAt: m.deletedAt?.toISOString() ?? null,
      editedAt: m.editedAt?.toISOString() ?? null,
      senderId: m.senderId,
      createdAt: m.createdAt.toISOString(),
      isOwn: m.senderId === userId,
      senderName: dn(m.sender?.profile ?? null),
    })),
  };
}

// ═══════════════════════════════════════════════════════════
//  GET OR CREATE CONVERSATION (direct)
// ═══════════════════════════════════════════════════════════

export async function getOrCreateConversation(
  partnerId: string
): Promise<{ conversationId: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  partnerIdSchema.parse({ partnerId });
  const userId = session.user.id;

  if (userId === partnerId) throw new Error("لا يمكنك مراسلة نفسك");

  const partnership = await db.studyPartnerRequest.findFirst({
    where: {
      OR: [
        { senderId: userId, receiverId: partnerId, status: "ACCEPTED" },
        { senderId: partnerId, receiverId: userId, status: "ACCEPTED" },
      ],
    },
    select: { id: true },
  });

  if (!partnership) throw new Error("يمكنك فقط مراسلة شركائك المقبولين");

  const [a, b] =
    userId < partnerId ? [userId, partnerId] : [partnerId, userId];

  try {
    const conversation = await db.conversation.upsert({
      where: {
        participantA_participantB: { participantA: a, participantB: b },
      },
      update: {},
      create: {
        participantA: a,
        participantB: b,
        members: {
          create: [{ userId }, { userId: partnerId }],
        },
      },
    });

    return { conversationId: conversation.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await db.conversation.findUnique({
        where: {
          participantA_participantB: { participantA: a, participantB: b },
        },
      });
      if (existing) return { conversationId: existing.id };
    }
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
//  START CONVERSATION
// ═══════════════════════════════════════════════════════════

export async function startConversation(partnerId: string) {
  const result = await getOrCreateConversation(partnerId);
  redirect(`/messages/${result.conversationId}`);
}

// ═══════════════════════════════════════════════════════════
//  SEND MESSAGE
// ═══════════════════════════════════════════════════════════

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{ messageId: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  const parsed = sendMessageSchema.parse({ conversationId, content });
  const userId = session.user.id;

  const conversation = await db.conversation.findUnique({
    where: { id: parsed.conversationId },
    select: {
      type: true,
      participantA: true,
      participantB: true,
      groupId: true,
    },
  });

  if (!conversation) throw new Error("المحادثة غير موجودة");

  if (conversation.type === "DIRECT") {
    if (
      conversation.participantA !== userId &&
      conversation.participantB !== userId
    )
      throw new Error("غير مصرح");
  } else if (conversation.type === "GROUP") {
    if (!conversation.groupId) throw new Error("محادثة غير صالحة");
    const membership = await db.groupMember.findFirst({
      where: {
        groupId: conversation.groupId,
        userId,
        status: "ACTIVE",
      },
    });
    if (!membership)
      throw new Error("غير مصرح — لست عضواً نشطاً");
  }

  const message = await db.message.create({
    data: {
      conversationId: parsed.conversationId,
      senderId: userId,
      content: parsed.content,
    },
  });

  await db.conversation.update({
    where: { id: parsed.conversationId },
    data: { updatedAt: new Date() },
  });

  // إشعار للمستلم (DIRECT فقط — MVP لا يرسل إشعارات للمجموعات)
  if (conversation.type === "DIRECT") {
    const partnerId =
      conversation.participantA === userId
        ? conversation.participantB
        : conversation.participantA;

        if (partnerId) {
          const recentNotif = await db.notification.findFirst({
            where: {
              userId: partnerId,
              type: "MESSAGE_RECEIVED",
              createdAt: { gte: new Date(Date.now() - 60_000) },
            },
          });
          if (!recentNotif) {
            const senderProfile = await db.profile.findUnique({
              where: { userId },
              select: { firstName: true, lastName: true },
            });
            await createNotification({
              userId: partnerId,
              type: "MESSAGE_RECEIVED",
              title: "رسالة جديدة",
              message: `${dn(senderProfile)}: ${parsed.content.slice(0, 60)}`,
              data: {
                conversationId: parsed.conversationId,
                senderId: userId,
              },
            });
          }
        }
  }

  revalidatePath(`/messages/${parsed.conversationId}`);
  revalidatePath("/messages");
  return { messageId: message.id };
}

// ═══════════════════════════════════════════════════════════
//  EDIT MESSAGE
// ═══════════════════════════════════════════════════════════

export async function editMessage(
  messageId: string,
  content: string
): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  const parsed = editMessageSchema.parse({ messageId, content });
  const userId = session.user.id;

  const message = await db.message.findUnique({
    where: { id: parsed.messageId },
    select: { senderId: true, deletedAt: true },
  });

  if (!message) throw new Error("الرسالة غير موجودة");
  if (message.senderId !== userId)
    throw new Error("لا يمكنك تعديل رسالة ليست لك");
  if (message.deletedAt)
    throw new Error("لا يمكن تعديل رسالة محذوفة");

  await db.message.update({
    where: { id: parsed.messageId },
    data: { content: parsed.content, editedAt: new Date() },
  });

  revalidatePath(`/messages`);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
//  MARK AS READ
// ═══════════════════════════════════════════════════════════

export async function markConversationAsRead(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  conversationIdSchema.parse({ conversationId });
  const userId = session.user.id;

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { participantA: true, participantB: true },
  });

  if (!conversation || !isConversationMember(conversation, userId))
    throw new Error("المحادثة غير موجودة");

  await db.conversationMember.updateMany({
    where: { conversationId, userId },
    data: { lastReadAt: new Date() },
  });

  revalidatePath("/messages");
  return { success: true };
}

function isConversationMember(
  conversation: { participantA: string | null; participantB: string | null },
  userId: string
): boolean {
  return (
    (conversation.participantA ?? "") === userId ||
    (conversation.participantB ?? "") === userId
  );
}

// ═══════════════════════════════════════════════════════════
//  DELETE MESSAGE (soft delete — own messages only)
// ═══════════════════════════════════════════════════════════

export async function deleteMessage(messageId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  messageIdSchema.parse({ messageId });
  const userId = session.user.id;

  const message = await db.message.findUnique({
    where: { id: messageId },
    select: { senderId: true, conversationId: true, deletedAt: true },
  });

  if (!message) throw new Error("الرسالة غير موجودة");
  if (message.senderId !== userId)
    throw new Error("لا يمكنك حذف رسالة ليست لك");
  if (message.deletedAt) throw new Error("الرسالة محذوفة بالفعل");

  await db.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/messages/${message.conversationId}`);
  revalidatePath("/messages");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
//  UNREAD COUNT
// ═══════════════════════════════════════════════════════════

export async function getUnreadMessageCount(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;

  const userId = session.user.id;

  const result = await db.$queryRaw<Array<{ count: bigint }>>(
    Prisma.sql`
      SELECT COUNT(*)::bigint as count
      FROM messages m
      JOIN conversation_members cm ON cm."conversationId" = m."conversationId"
      WHERE cm."userId" = ${userId}
        AND m."senderId" != ${userId}
        AND m."deletedAt" IS NULL
        AND (cm."lastReadAt" IS NULL OR m."createdAt" > cm."lastReadAt")
    `
  );

  return Number(result[0]?.count ?? 0);
}