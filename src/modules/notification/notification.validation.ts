import { z } from "zod";
import { idParamSchema } from "../../common/middleware/validate.middleware";

import {
  NotificationChannel,
  NotificationPriority,
  NOTIFICATION_CHANNEL,
  NOTIFICATION_PRIORITY,
} from "./notification.model";

const notificationPriorities = Object.values(NOTIFICATION_PRIORITY) as [
  NotificationPriority,
  ...NotificationPriority[],
];

const notificationChannels = Object.values(NOTIFICATION_CHANNEL) as [
  NotificationChannel,
  ...NotificationChannel[],
];

export const createNotificationSchema = z.object({
  recipientId: z.string().trim().min(1, "Recipient ID is required"),
  actorUserId: z.string().trim().optional(),
  type: z.string().trim().min(1, "Notification type is required").max(120),
  title: z.string().trim().min(1, "Title is required").max(160),
  message: z.string().trim().min(1, "Message is required").max(1000),
  priority: z.enum(notificationPriorities).optional(),
  channels: z.array(z.enum(notificationChannels)).optional(),
  entityType: z.string().trim().optional(),
  entityId: z.string().trim().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const notificationListQuerySchema = z.object({
  readStatus: z.enum(["all", "read", "unread"]).optional(),
  archived: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  priority: z.enum(notificationPriorities).optional(),
  type: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  entityId: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

export const notificationIdSchema = idParamSchema;
