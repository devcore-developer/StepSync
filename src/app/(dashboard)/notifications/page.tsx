"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import NotificationItem from "@/components/shared/notification-item";
import { groupNotificationsByDate } from "@/lib/notifications";
import {
  getNotifications,
  markAllNotificationsAsRead,
  deleteAllReadNotifications,
} from "@/actions/student/notifications";
import type {
  NotificationItem as NotificationItemType,
  NotificationFilter,
} from "@/types/notifications";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItemType[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingRead, setDeletingRead] = useState(false);

  const fetchNotifications = useCallback(
    async (options?: { cursor?: string; filter?: NotificationFilter }) => {
      if (options?.cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      try {
        const result = await getNotifications({
          cursor: options?.cursor,
          filter: options?.filter ?? filter,
        });
        if (options?.cursor) {
          setNotifications((prev) => [...prev, ...result.notifications]);
        } else {
          setNotifications(result.notifications);
        }
        setNextCursor(result.nextCursor);
        setUnreadCount(result.unreadCount);
      } catch {
        toast.error("حدث خطأ أثناء تحميل الإشعارات.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    setNotifications([]);
    setNextCursor(null);
    fetchNotifications({ filter });
  }, [filter, fetchNotifications]);

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      const result = await markAllNotificationsAsRead();
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      if (result.count > 0) {
        toast.success(`تم تعيين ${result.count} إشعار كمقروء.`);
      }
    } catch {
      toast.error("تعذر تحديث الإشعارات.");
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleDeleteRead() {
    if (!confirm("هل تريد حذف جميع الإشعارات المقروءة؟")) return;
    setDeletingRead(true);
    try {
      const result = await deleteAllReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      toast.success(`تم حذف ${result.count} إشعار.`);
    } catch {
      toast.error("تعذر حذف الإشعارات.");
    } finally {
      setDeletingRead(false);
    }
  }

  function handleItemUpdated() {
    // أعد جلب البيانات عند أي تغيير
    fetchNotifications({ filter });
  }

  const groups = groupNotificationsByDate(notifications);

  // ─── Loading State ──────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Skeleton Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        {/* Skeleton Tabs */}
        <Skeleton className="h-10 w-64 mb-6" />
        {/* Skeleton Items */}
        <div className="rounded-lg border divide-y">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* ─── Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h1 className="text-xl font-bold">الإشعارات</h1>
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} إشعار غير مقروء
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAll}
              disabled={markingAll}
              className="text-xs"
            >
              <CheckCheck className="h-3.5 w-3.5 ml-1.5" />
              {markingAll ? "جاري التحديث..." : "تحديد الكل كمقروء"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteRead}
            disabled={deletingRead || notifications.every((n) => !n.isRead)}
            className="text-xs"
          >
            <Trash2 className="h-3.5 w-3.5 ml-1.5" />
            {deletingRead ? "جاري الحذف..." : "حذف المقروءة"}
          </Button>
        </div>
      </div>

      {/* ─── Filters ────────────────────────────────── */}
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as NotificationFilter)}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="all" className="text-xs px-4">
            الكل
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-xs px-4">
            غير مقروءة
            {unreadCount > 0 && (
              <span className="mr-1.5 inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="read" className="text-xs px-4">
            مقروءة
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ─── Notification List ──────────────────────── */}
      {notifications.length === 0 ? (
        <div className="rounded-lg border py-16 text-center">
          <Bell className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
          <p className="font-medium text-sm">
            {filter === "unread"
              ? "لا توجد إشعارات جديدة."
              : filter === "read"
                ? "لا توجد إشعارات مقروءة."
                : "لا توجد إشعارات حتى الآن."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border divide-y overflow-hidden">
          {groups.map((group, gi) => (
            <div key={group.label}>
              {gi > 0 && <Separator />}
              {/* Group Label */}
              <div className="px-4 py-2 bg-muted/30">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {group.label}
                </p>
              </div>
              {/* Group Items */}
              {group.notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onUpdated={handleItemUpdated}
                />
              ))}
            </div>
          ))}

          {/* Load More */}
          {nextCursor && (
            <div className="px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  fetchNotifications({ cursor: nextCursor, filter })
                }
                disabled={loadingMore}
                className="w-full text-xs"
              >
                {loadingMore ? (
                  <RefreshCw className="h-3.5 w-3.5 ml-1.5 animate-spin" />
                ) : null}
                {loadingMore ? "جاري التحميل..." : "تحميل المزيد"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}