"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { toast } from "sonner";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
} from "@/actions/student/notifications";
import NotificationItem from "./notification-item";
import { cn } from "@/lib/utils";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<
    Awaited<ReturnType<typeof getNotifications>>["notifications"]
  >([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      // صامت — لا نظهر خطأ في الجرس
    }
  }, []);

  const fetchPreview = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getNotifications({});
      setNotifications(result.notifications.slice(0, 5));
      setUnreadCount(result.unreadCount);
    } catch {
      toast.error("تعذر تحميل الإشعارات.");
    } finally {
      setLoading(false);
    }
  }, []);

  // جلب العدد عند التحميل + عند كل focus
  useEffect(() => {
    fetchCount();
    const onFocus = () => fetchCount();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchCount]);

  // جلب المعاينة عند فتح الـ popover
  useEffect(() => {
    if (open) {
      fetchPreview();
    }
  }, [open, fetchPreview]);

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
            aria-label="الإشعارات"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span
                className={cn(
                  "absolute -top-0.5 -left-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-primary-foreground",
                  unreadCount > 9 ? "h-5 min-w-[20px] text-[9px]" : ""
                )}
                style={{
                  background:
                    "var(--primary, hsl(var(--primary)))",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />

      <PopoverContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
      >
        {/* رأس */}
        <div className="flex items-center justify-between px-4 py-3">
          <p className="font-semibold text-sm">الإشعارات</p>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={markingAll}
              className="text-xs text-primary hover:underline disabled:opacity-50"
            >
              {markingAll ? "جاري التحديث..." : "تعيين الكل كمقروء"}
            </button>
          )}
        </div>
        <Separator />

        {/* المحتوى */}
        <div className="max-h-[360px] overflow-y-auto">
          {loading ? (
            <div className="space-y-1 p-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                لا توجد إشعارات جديدة.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} compact onUpdated={fetchPreview} />
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* تذييل */}
        <div className="px-4 py-2.5">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-xs font-medium text-primary hover:underline"
          >
            عرض كل الإشعارات
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}