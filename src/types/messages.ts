export interface ConversationPreview {
  id: string;
  partnerId: string;
  partnerName: string;
  isGroup: boolean;
  lastMessage: string | null;
  lastMessageAt: string | null;
  hasUnread: boolean;
}

export interface MessageWithSender {
  id: string;
  content: string;
  isDeleted: boolean;
  deletedAt: string | null;
  editedAt: string | null;
  senderId: string;
  senderName: string;
  createdAt: string;
  isOwn: boolean;
}

export interface ConversationDetail {
  id: string;
  partnerId: string;
  partnerName: string;
  isGroup: boolean;
  memberCount?: number;
  messages: MessageWithSender[];
}