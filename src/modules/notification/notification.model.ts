import mongoose, { Document, Schema } from "mongoose";

export const NOTIFICATION_PRIORITY = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
} as const;

export const NOTIFICATION_CHANNEL = {
  IN_APP: "in_app",
  EMAIL: "email",
} as const;

export type NotificationPriority =
  (typeof NOTIFICATION_PRIORITY)[keyof typeof NOTIFICATION_PRIORITY];
export type NotificationChannel =
  (typeof NOTIFICATION_CHANNEL)[keyof typeof NOTIFICATION_CHANNEL];

export interface INotification extends Document {
  tenantId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  actorUserId?: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  readAt?: Date;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: Object.values(NOTIFICATION_PRIORITY),
      default: NOTIFICATION_PRIORITY.NORMAL,
    },
    channels: {
      type: [String],
      enum: Object.values(NOTIFICATION_CHANNEL),
      default: [NOTIFICATION_CHANNEL.IN_APP],
    },
    entityType: String,
    entityId: String,
    metadata: Schema.Types.Mixed,
    readAt: Date,
    archivedAt: Date,
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ tenantId: 1, recipientId: 1, readAt: 1 });
notificationSchema.index({ tenantId: 1, recipientId: 1, createdAt: -1 });
notificationSchema.index({
  type: "text",
  title: "text",
  message: "text",
  entityType: "text",
  entityId: "text",
});

export const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);
