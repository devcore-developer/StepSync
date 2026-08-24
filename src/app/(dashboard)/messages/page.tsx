"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getMyConversations } from "@/actions/student/messages";
import ConversationList from "@/components/shared/conversation-list";
import type { ConversationPreview } from "@/types/messages";
import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyConversations()
      .then(setConversations)
      .catch(() => toast.error("فشل تحميل المحادثات"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <MessageSquare className="h-6 w-6" />
        <h1 className="text-2xl font-bold">الرسائل</h1>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">جارٍ التحميل...</p>
        </div>
      ) : (
        <div className="flex-1 rounded-lg border bg-card overflow-hidden">
          <ConversationList conversations={conversations} />
        </div>
      )}
    </div>
  );
}