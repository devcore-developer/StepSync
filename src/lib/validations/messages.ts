import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1, "معرف المحادثة مطلوب"),
  content: z
    .string()
    .trim()
    .min(1, "الرسالة لا يمكن أن تكون فارغة")
    .max(2000, "الرسالة طويلة جداً"),
});

export const editMessageSchema = z.object({
  messageId: z.string().min(1, "معرف الرسالة مطلوب"),
  content: z
    .string()
    .trim()
    .min(1, "الرسالة لا يمكن أن تكون فارغة")
    .max(2000, "الرسالة طويلة جداً"),
});

export const conversationIdSchema = z.object({
  conversationId: z.string().min(1, "معرف المحادثة مطلوب"),
});

export const partnerIdSchema = z.object({
  partnerId: z.string().min(1, "معرف الشريك مطلوب"),
});

export const messageIdSchema = z.object({
  messageId: z.string().min(1, "معرف الرسالة مطلوب"),
});