"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bell,
  UserPlus,
  Users,
  MessageCircle,
  CalendarCheck,
  Sparkles,
  MoreHorizontal,
  Check,
  Eye,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  getNotificationActionUrl,
  getNotificationIconName,
  formatRelativeTime,
} from "@/lib/notifications";
import type { NotificationIconName } from "@/lib/notifications";
import {
  markNotificationAsRead,
  markNotificationAsUnread,
  deleteNotification,
} from "@/actions/student/notifications";
import type { NotificationItem } from "@/types/notifications";

const ICON_MAP: Record<NotificationIconName, React.ComponentType<{ className?: string }>> = {
  "user-plus": UserPlus,
  users: Users,
  "message-circle": MessageCircle,
  "calendar-check": CalendarCheck,
  sparkles: Sparkles,
  bell: Bell,
};

interface NotificationItemProps {
  notification: NotificationItem;
  onUpdated?: () => void;
  compact?: boolean;
}

export default function NotificationItemComponent({
  notification,
  onUpdated,
  compact = false,
}: NotificationItemProps) {
  const router = useRouter();
  const actionUrl = getNotificationActionUrl(notification);
  const iconName = getNotificationIconName(notification.type);
  const IconComponent = ICON_MAP[iconName] ?? Bell;

  async function handleMarkRead() {
    try {
      await markNotificationAsRead({ notificationId: notification.id });
      onUpdated?.();
    } catch {
      toast.error("تعذر تحديث الإشعار.");
    }
  }

  async function handleMarkUnread() {
    try {
      await markNotificationAsUnread({ notificationId: notification.id });
      onUpdated?.();
    } catch {
      toast.error("تعذر تحديث الإشعار.");
    }
  }

  async function handleDelete() {
    try {
      await deleteNotification({ notificationId: notification.id });
      onUpdated?.();
    } catch {
      toast.error("تعذر حذف الإشعار.");
    }
  }

  function handleActionClick(e: React.MouseEvent) {
    if (actionUrl) {
      // لو الإشعار مش مقروء، عيّنه كمقروء عند الفتح
      if (!notification.isRead) {
        markNotificationAsRead({ notificationId: notification.id });
      }
      router.push(actionUrl);
    }
  }

  const content = (
    <div
      className={cn(
        "group relative flex items-start gap-3 px-4 transition-colors",
        compact ? "py-2.5" : "py-3.5",
        notification.isRead
          ? "hover:bg-muted/50"
          : "bg-primary/[0.03] hover:bg-primary/[0.06]",
        actionUrl && "cursor-pointer"
      )}
      onClick={actionUrl ? handleActionClick : undefined}
    >
      {/* مؤشر غير مقروء */}
      {!notification.isRead && (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
      )}

      {/* الأيقونة */}
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          notification.isRead
            ? "bg-muted text-muted-foreground"
            : "bg-primary/10 text-primary"
        )}
      >
        <IconComponent className="h-4 w-4" />
      </div>

      {/* المحتوى */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm leading-relaxed",
            notification.isRead
              ? "text-muted-foreground"
              : "text-foreground font-medium"
          )}
        >
          {notification.title}
        </p>
        {!compact && notification.message && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[90%]">
            {notification.message}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {/* رابط خارجي */}
      {actionUrl && (
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      {/* قائمة الإجراءات */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {notification.isRead ? (
            <DropdownMenuItem onClick={handleMarkUnread}>
              <Eye className="h-4 w-4 ml-2" />
              تعيين كغير مقروء
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleMarkRead}>
              <Check className="h-4 w-4 ml-2" />
              تعيين كمقروء
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 ml-2" />
            حذف
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return content;
}