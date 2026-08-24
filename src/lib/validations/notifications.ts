import { z } from "zod";

export const notificationIdSchema = z.object({
  notificationId: z.string().min(1, "معرف الإشعار مطلوب"),
});

export const cursorSchema = z.object({
  cursor: z.string().optional(),
});

export const filterSchema = z.enum(["all", "unread", "read"]).default("all");

export const notificationsQuerySchema = z.object({
  cursor: z.string().optional(),
  filter: z.enum(["all", "unread", "read"]).default("all"),
});