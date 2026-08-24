"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge"; // ✅ تم حذف استيراد Card غير المستخدم بالكامل
import type { ConversationPreview } from "@/types/messages";

interface ConversationListProps {
  conversations: ConversationPreview[];
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} ي`;
  return new Date(dateStr).toLocaleDateString("ar-EG");
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase() || "م";
}

export default function ConversationList({ conversations }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <p className="text-3xl mb-3">💬</p>
        <p className="font-medium">لا توجد محادثات بعد</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          ابدأ محادثة مع شريك دراستك من صفحة شركاء الدراسة.
        </p>
        <div className="flex gap-2 mt-4">
          <Link href="/partners">
            <button className="text-sm text-primary hover:underline">
              تصفح الشركاء
            </button>
          </Link>
          <Link href="/groups">
            <button className="text-sm text-primary hover:underline">
              المجموعات
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/messages/${conv.id}`}
          className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors"
        >
          {/* الأفاتار */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
              conv.isGroup
                ? "bg-primary/10 text-primary"
                : "bg-primary/10 text-primary"
            }`}
          >
            {conv.isGroup ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <path d="M12 3v18" />
              </svg>
            ) : (
              getInitial(conv.partnerName)
            )}
          </div>

          {/* المحتوى */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm truncate">
                {conv.partnerName}
              </p>
              {conv.isGroup && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 shrink-0"
                >
                  مجموعة
                </Badge>
              )}
              <span className="text-[11px] text-muted-foreground shrink-0">
                {timeAgo(conv.lastMessageAt)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className="text-xs text-muted-foreground truncate">
                {conv.lastMessage ?? "ابدأ المحادثة"}
              </p>
              {conv.hasUnread && (
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}