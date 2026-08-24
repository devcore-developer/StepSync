import { db } from "@/lib/db";
import type { NotificationItem, NotificationGroup } from "@/types/notifications";
import type { NotificationType } from "@prisma/client";

export const NOTIFICATION_TYPES = {
  PARTNER_REQUEST: "PARTNER_REQUEST",
  PARTNER_ACCEPTED: "PARTNER_ACCEPTED",
  PARTNER_REJECTED: "PARTNER_REJECTED",
  GROUP_JOIN_REQUEST: "JOIN_REQUEST",
  GROUP_JOIN_ACCEPTED: "JOIN_ACCEPTED",
  GROUP_JOIN_REJECTED: "JOIN_REJECTED",
  GROUP_MEMBER_REMOVED: "GROUP_MEMBER_REMOVED",
  GROUP_MEMBER_PROMOTED: "GROUP_MEMBER_PROMOTED",
  MESSAGE_RECEIVED: "MESSAGE_RECEIVED",
  RESCHEDULE_COMPLETED: "RESCHEDULE_COMPLETED",
  AI_RECOMMENDATION: "AI_RECOMMENDATION",
  DRIFT_WARNING: "DRIFT_WARNING",
  GROUP_INVITE: "GROUP_INVITE",
  SYSTEM_ANNOUNCEMENT: "SYSTEM_ANNOUNCEMENT",
} as const;

export function getNotificationActionUrl(notification: {
  type: string;
  data?: Record<string, unknown> | null;
}): string | null {
  const data = notification.data ?? {};

  switch (notification.type) {
    case NOTIFICATION_TYPES.PARTNER_REQUEST:
    case NOTIFICATION_TYPES.PARTNER_ACCEPTED:
    case NOTIFICATION_TYPES.PARTNER_REJECTED:
      return "/partners/my";

    case NOTIFICATION_TYPES.GROUP_JOIN_REQUEST:
    case NOTIFICATION_TYPES.GROUP_INVITE:
      return typeof data.groupId === "string"
        ? `/groups/${data.groupId}/manage`
        : null;

    case NOTIFICATION_TYPES.GROUP_JOIN_ACCEPTED:
      return typeof data.groupId === "string"
        ? `/groups/${data.groupId}`
        : null;

    case NOTIFICATION_TYPES.GROUP_JOIN_REJECTED:
      return "/groups/my";

    case NOTIFICATION_TYPES.MESSAGE_RECEIVED:
      return typeof data.conversationId === "string"
        ? `/messages/${data.conversationId}`
        : null;

    case NOTIFICATION_TYPES.RESCHEDULE_COMPLETED:
    case NOTIFICATION_TYPES.DRIFT_WARNING:
    case NOTIFICATION_TYPES.AI_RECOMMENDATION:
      return "/study-plan";

    case NOTIFICATION_TYPES.GROUP_MEMBER_REMOVED:
      return "/groups/my";

    case NOTIFICATION_TYPES.GROUP_MEMBER_PROMOTED:
      return typeof data.groupId === "string"
        ? `/groups/${data.groupId}`
        : null;

    case NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT:
      return null;

    default:
      return null;
  }
}

export type NotificationIconName =
  | "user-plus"
  | "users"
  | "message-circle"
  | "calendar-check"
  | "sparkles"
  | "bell";

export function getNotificationIconName(
  type: string
): NotificationIconName {
  switch (type) {
    case NOTIFICATION_TYPES.PARTNER_REQUEST:
    case NOTIFICATION_TYPES.PARTNER_ACCEPTED:
    case NOTIFICATION_TYPES.PARTNER_REJECTED:
      return "user-plus";
    case NOTIFICATION_TYPES.GROUP_JOIN_REQUEST:
    case NOTIFICATION_TYPES.GROUP_JOIN_ACCEPTED:
    case NOTIFICATION_TYPES.GROUP_JOIN_REJECTED:
    case NOTIFICATION_TYPES.GROUP_INVITE:
    case NOTIFICATION_TYPES.GROUP_MEMBER_REMOVED:
    case NOTIFICATION_TYPES.GROUP_MEMBER_PROMOTED:
      return "users";
    case NOTIFICATION_TYPES.MESSAGE_RECEIVED:
      return "message-circle";
    case NOTIFICATION_TYPES.RESCHEDULE_COMPLETED:
    case NOTIFICATION_TYPES.DRIFT_WARNING:
      return "calendar-check";
    case NOTIFICATION_TYPES.AI_RECOMMENDATION:
      return "sparkles";
    default:
      return "bell";
  }
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "الآن";
  if (minutes < 60) return `منذ ${minutes} د`;
  if (hours < 24) return `منذ ${hours} س`;
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسبوع`;
  if (days < 365) return `منذ ${Math.floor(days / 30)} شهر`;
  return `منذ ${Math.floor(days / 365)} سنة`;
}

export function groupNotificationsByDate(
  notifications: NotificationItem[]
): NotificationGroup[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);

  const groups: NotificationGroup[] = [
    { label: "اليوم", notifications: [] },
    { label: "أمس", notifications: [] },
    { label: "سابقاً", notifications: [] },
  ];

  for (const n of notifications) {
    const d = new Date(n.createdAt);
    if (d >= todayStart) {
      groups[0].notifications.push(n);
    } else if (d >= yesterdayStart) {
      groups[1].notifications.push(n);
    } else {
      groups[2].notifications.push(n);
    }
  }

  return groups.filter((g) => g.notifications.length > 0);
}

interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
}

const TYPE_TO_CATEGORY: Record<string, string> = {
  TASK_REMINDER: "study",
  MISSED_TASK: "study",
  FALLING_BEHIND: "study",
  MILESTONE_REACHED: "study",
  RESCHEDULE_COMPLETED: "study",
  DRIFT_WARNING: "study",
  AI_RECOMMENDATION: "ai",
  PARTNER_REQUEST: "partners",
  PARTNER_ACCEPTED: "partners",
  PARTNER_REJECTED: "partners",
  MESSAGE_RECEIVED: "messages",
  GROUP_INVITE: "groups",
  JOIN_REQUEST: "groups",
  JOIN_ACCEPTED: "groups",
  JOIN_REJECTED: "groups",
  GROUP_MEMBER_REMOVED: "groups",
  GROUP_MEMBER_PROMOTED: "groups",
  SYSTEM_ANNOUNCEMENT: "study",
};

function getNotificationCategory(type: string): string {
  return TYPE_TO_CATEGORY[type] ?? "study";
}

export async function createNotification(
  input: CreateNotificationInput
) {
  const category = getNotificationCategory(input.type);
  const pref = await db.notificationPreference.findUnique({
    where: { userId: input.userId },
    select: { [category]: true },
  });

  if (pref && !(pref as Record<string, boolean>)[category]) {
    return null;
  }

  return db.notification.create({
    data: {
      userId: input.userId,
      type: input.type as NotificationType,
      title: input.title,
      message: input.message ?? "",
      data: input.data ? JSON.parse(JSON.stringify(input.data)) : undefined,
    },
  });
}