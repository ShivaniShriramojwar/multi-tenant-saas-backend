import {
  NotificationChannel,
  NotificationPriority,
} from "./notification.model";

export interface CreateNotificationInput {
  recipientId: string;
  actorUserId?: string;
  type: string;
  title: string;
  message: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationListQuery {
  page: number;
  limit: number;
  skip: number;
  readStatus?: "all" | "read" | "unread";
  archived?: boolean;
  priority?: NotificationPriority;
  type?: string;
  entityType?: string;
  entityId?: string;
  search?: string;
}
