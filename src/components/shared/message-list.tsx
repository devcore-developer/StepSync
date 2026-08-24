"use client";

import { useRef, useEffect } from "react";
import MessageBubble from "./message-bubble";
import type { MessageWithSender } from "@/types/messages";

interface MessageListProps {
  messages: MessageWithSender[];
  isGroup: boolean;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
}

export default function MessageList({
  messages,
  isGroup,
  onEdit,
  onDelete,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">
          ابدأ المحادثة بإرسال رسالة
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 px-4 py-4">
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          isGroup={isGroup}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}