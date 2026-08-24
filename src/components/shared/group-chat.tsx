"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  sendMessage,
  deleteMessage,
  editMessage,
} from "@/actions/student/messages";
import type { ConversationDetail, MessageWithSender } from "@/types/messages";
import MessageList from "./message-list";
import MessageComposer from "./message-composer";
import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";

interface Props {
  conversation: ConversationDetail;
  currentUserId: string;
}

export default function ConversationView({
  conversation,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageWithSender[]>(
    conversation.messages
  );
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleSend = useCallback(
    async (content: string) => {
      if (sending) return;
      setSending(true);
      try {
        const result = await sendMessage(conversation.id, content);
        const newMessage: MessageWithSender = {
          id: result.messageId,
          content,
          isDeleted: false,
          deletedAt: null,
          editedAt: null,
          senderId: currentUserId,
          senderName: "",
          createdAt: new Date().toISOString(),
          isOwn: true,
        };
        setMessages((prev) => [...prev, newMessage]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "فشل الإرسال");
      } finally {
        setSending(false);
      }
    },
    [conversation.id, currentUserId, sending]
  );
  const handleDelete = useCallback(
    async (messageId: string) => {
      if (!confirm("هل تريد حذف هذه الرسالة؟")) return;
      try {
        await deleteMessage(messageId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  isDeleted: true,
                  deletedAt: new Date().toISOString(),
                  content: "",
                }
              : m
          )
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "فشل الحذف");
      }
    },
    []
  );

  const handleStartEdit = useCallback((id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditContent("");
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editContent.trim()) return;
    try {
      await editMessage(editingId, editContent);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editingId
            ? {
                ...m,
                content: editContent.trim(),
                editedAt: new Date().toISOString(),
              }
            : m
        )
      );
      setEditingId(null);
      setEditContent("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل التعديل");
    }
  }, [editingId, editContent]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3 shrink-0">
        <Link
          href="/messages"
          className="md:hidden p-1 -ml-1 hover:bg-muted rounded-md"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">
            {conversation.partnerName}
          </h2>
          {conversation.isGroup && conversation.memberCount && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {conversation.memberCount} عضو
            </p>
          )}
        </div>
        {conversation.isGroup && (
          <Link href={`/groups/${conversation.partnerId}`}>
            <button className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground md:hidden">
              <Users className="h-4 w-4" />
            </button>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.map((m) =>
          m.id === editingId ? (
            <div
              key={m.id}
              className="flex justify-end px-4 py-2"
            >
              <div className="max-w-[75%] w-full space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  autoFocus
                  className="min-h-[60px] w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editContent.trim()}
                    className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    حفظ
                  </button>
                </div>
              </div>
            </div>
          ) : null
        )}
        <MessageList
          messages={messages}
          isGroup={conversation.isGroup}
          onEdit={handleStartEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Composer */}
      <div className="shrink-0">
        <MessageComposer
          onSend={handleSend}
          disabled={sending}
          placeholder={
            conversation.isGroup
              ? "اكتب رسالة للمجموعة..."
              : "اكتب رسالة..."
          }
        />
      </div>
    </div>
  );
}