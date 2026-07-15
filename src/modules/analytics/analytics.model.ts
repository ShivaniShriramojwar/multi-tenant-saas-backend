import mongoose, { Document, Schema } from "mongoose";

export interface IAnalyticsEvent extends Document {
  tenantId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  eventName: string;
  entityType?: string;
  entityId?: string;
  properties?: Record<string, unknown>;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const analyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    eventName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entityType: String,
    entityId: String,
    properties: Schema.Types.Mixed,
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

analyticsEventSchema.index({ tenantId: 1, eventName: 1, occurredAt: -1 });
analyticsEventSchema.index({ tenantId: 1, createdAt: -1 });

export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>(
  "AnalyticsEvent",
  analyticsEventSchema,
);
