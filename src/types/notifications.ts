export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResult {
  notifications: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
}

export type NotificationFilter = "all" | "unread" | "read";

export interface NotificationGroup {
  label: string;
  notifications: NotificationItem[];
}

export interface NotificationPreferences {
  study: boolean;
  partners: boolean;
  messages: boolean;
  groups: boolean;
  ai: boolean;
}

export type NotificationCategory = keyof NotificationPreferences;