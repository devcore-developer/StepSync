import type { MessageWithSender } from "@/types/messages";

interface MessageBubbleProps {
  message: MessageWithSender;
  isGroup: boolean;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("ar-EG", {
    month: "short",
    day: "numeric",
  });
}

export default function MessageBubble({
  message,
  isGroup,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  if (message.isDeleted) {
    return (
      <div className="flex justify-center py-1">
        <span className="text-xs text-muted-foreground italic">
          تم حذف هذه الرسالة
        </span>
      </div>
    );
  }

  if (message.isOwn) {
    return (
      <div className="flex justify-end group">
        <div className="max-w-[75%] relative">
          {message.editedAt && (
            <span className="text-[10px] text-muted-foreground text-right block mr-1 mb-0.5">
              تم التعديل
            </span>
          )}
          <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md">
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
          <div className="flex items-center justify-end gap-1 mt-0.5 mr-1">
            <span className="text-[10px] text-muted-foreground">
              {formatTime(message.createdAt)}
            </span>
          </div>
          {!message.isDeleted && (
            <div className="absolute -top-3 left-0 hidden group-hover:flex items-center gap-0.5 bg-background border rounded-md shadow-sm p-0.5">
              {onEdit && (
                <button
                  className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => onEdit(message.id, message.content)}
                  title="تعديل"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l-1.27-1.27a2 2 0 0 1-2.83-2.83l-1.27-1.27a2 2 0 0 1 2.83-2.83L14.5 5.5" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                  onClick={() => onDelete(message.id)}
                  title="حذف"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2-2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[75%]">
        {isGroup && (
          <p className="text-[10px] font-medium text-muted-foreground mb-0.5 ml-1">
            {message.senderName}
          </p>
        )}
        <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-bl-md">
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        {message.editedAt && (
          <span className="text-[10px] text-muted-foreground block ml-1 mt-0.5">
            تم التعديل
          </span>
        )}
        <p className="text-[10px] text-muted-foreground mt-0.5 ml-1">
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}