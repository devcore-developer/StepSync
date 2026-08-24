"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function auth() {
  return getServerSession(authOptions);
}
import { revalidatePath } from "next/cache";
import {
  notificationIdSchema,
  notificationsQuerySchema,
} from "@/lib/validations/notifications";
import type { NotificationsResult, NotificationItem } from "@/types/notifications";

const PAGE_SIZE = 20;

// ═══════════════════════════════════════════════════════════
//  GET NOTIFICATIONS — Cursor-based pagination
// ═══════════════════════════════════════════════════════════

export async function getNotifications(
  rawOptions?: { cursor?: string; filter?: string }
): Promise<NotificationsResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");
  const userId = session.user.id;

  const parsed = notificationsQuerySchema.safeParse(rawOptions ?? {});
  const cursor = parsed.success ? parsed.data.cursor : undefined;
  const filter = parsed.success ? parsed.data.filter : "all";

  const where: Record<string, unknown> = { userId };
  if (filter === "unread") where.isRead = false;
  if (filter === "read") where.isRead = true;
  if (cursor) {
    where.createdAt = { lt: new Date(cursor) };
  }

  const rows = await db.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      data: true,
      isRead: true,
      createdAt: true,
    },
  });

  let nextCursor: string | null = null;
  if (rows.length > PAGE_SIZE) {
    const last = rows.pop()!;
    nextCursor = last.createdAt.toISOString();
  }

  const notifications: NotificationItem[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    message: r.message,
    data: r.data as Record<string, unknown> | null,
    isRead: r.isRead,
    createdAt: r.createdAt.toISOString(),
  }));

  const unreadCount = await db.notification.count({
    where: { userId, isRead: false },
  });

  return { notifications, nextCursor, unreadCount };
}

// ═══════════════════════════════════════════════════════════
//  GET UNREAD COUNT
// ═══════════════════════════════════════════════════════════

export async function getUnreadNotificationCount(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;

  return db.notification.count({
    where: {
      userId: session.user.id,
      isRead: false,
    },
  });
}

// ═══════════════════════════════════════════════════════════
//  MARK AS READ
// ═══════════════════════════════════════════════════════════

export async function markNotificationAsRead(
  rawInput: { notificationId: string }
): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  const parsed = notificationIdSchema.safeParse(rawInput);
  if (!parsed.success) throw new Error("معرف الإشعار غير صالح");

  const result = await db.notification.updateMany({
    where: {
      id: parsed.data.notificationId,
      userId: session.user.id, // ✅ تأكيد الملكية
    },
    data: { isRead: true },
  });

  if (result.count === 0) {
    throw new Error("الإشعار غير موجود");
  }

  revalidatePath("/notifications");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
//  MARK AS UNREAD
// ═══════════════════════════════════════════════════════════

export async function markNotificationAsUnread(
  rawInput: { notificationId: string }
): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  const parsed = notificationIdSchema.safeParse(rawInput);
  if (!parsed.success) throw new Error("معرف الإشعار غير صالح");

  const result = await db.notification.updateMany({
    where: {
      id: parsed.data.notificationId,
      userId: session.user.id,
    },
    data: { isRead: false },
  });

  if (result.count === 0) {
    throw new Error("الإشعار غير موجود");
  }

  revalidatePath("/notifications");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
//  MARK ALL AS READ
// ═══════════════════════════════════════════════════════════

export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
  count: number;
}> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  const result = await db.notification.updateMany({
    where: {
      userId: session.user.id, // ✅ المستخدم الحالي فقط
      isRead: false,
    },
    data: { isRead: true },
  });

  revalidatePath("/notifications");
  return { success: true, count: result.count };
}

// ═══════════════════════════════════════════════════════════
//  DELETE NOTIFICATION
// ═══════════════════════════════════════════════════════════

export async function deleteNotification(
  rawInput: { notificationId: string }
): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  const parsed = notificationIdSchema.safeParse(rawInput);
  if (!parsed.success) throw new Error("معرف الإشعار غير صالح");

  const result = await db.notification.deleteMany({
    where: {
      id: parsed.data.notificationId,
      userId: session.user.id, // ✅ تأكيد الملكية
    },
  });

  if (result.count === 0) {
    throw new Error("الإشعار غير موجود");
  }

  revalidatePath("/notifications");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
//  DELETE ALL READ NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

export async function deleteAllReadNotifications(): Promise<{
  success: boolean;
  count: number;
}> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  const result = await db.notification.deleteMany({
    where: {
      userId: session.user.id, // ✅ المستخدم الحالي فقط
      isRead: true,
    },
  });

  revalidatePath("/notifications");
  return { success: true, count: result.count };
}

// ═══════════════════════════════════════════════════════════
//  GET NOTIFICATION PREFERENCES
// ═══════════════════════════════════════════════════════════

export async function getNotificationPreferences() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  let pref = await db.notificationPreference.findUnique({
    where: { userId: session.user.id },
    select: {
      study: true,
      partners: true,
      messages: true,
      groups: true,
      ai: true,
    },
  });

  if (!pref) {
    // أنشئ تفضيلات افتراضية لما المستخدم أول مرة يفتح الصفحة
    pref = await db.notificationPreference.create({
      data: { userId: session.user.id },
      select: {
        study: true,
        partners: true,
        messages: true,
        groups: true,
        ai: true,
      },
    });
  }

  return pref;
}

// ═══════════════════════════════════════════════════════════
//  UPDATE NOTIFICATION PREFERENCES
// ═══════════════════════════════════════════════════════════

export async function updateNotificationPreferences(
  raw: Record<string, boolean>
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("غير مصرح");

  const allowedKeys = ["study", "partners", "messages", "groups", "ai"] as const;

  const data: Record<string, boolean> = {};
  for (const key of allowedKeys) {
    if (key in raw && typeof raw[key] === "boolean") {
      data[key] = raw[key];
    }
  }

  const result = await db.notificationPreference.upsert({
    where: { userId: session.user.id },
    update: data,
    create: {
      userId: session.user.id,
      ...data,
    },
  });

  revalidatePath("/settings/notifications");
  return result;
}