import mongoose, { Document, Schema } from "mongoose";

export const ACTIVITY_VISIBILITY = {
  INTERNAL: "internal",
  CUSTOMER: "customer",
} as const;

export type ActivityVisibility =
  (typeof ACTIVITY_VISIBILITY)[keyof typeof ACTIVITY_VISIBILITY];

export const ACTIVITY_VISIBILITIES = Object.values(ACTIVITY_VISIBILITY) as [
  ActivityVisibility,
  ...ActivityVisibility[],
];

export interface IActivity extends Document {
  tenantId: mongoose.Types.ObjectId;
  actorUserId: mongoose.Types.ObjectId;
  action: string;
  targetType: string;
  targetId: string;
  projectId?: mongoose.Types.ObjectId;
  summary: string;
  changes?: Array<{
    field: string;
    from?: unknown;
    to?: unknown;
  }>;
  metadata?: Record<string, unknown>;
  visibility: ActivityVisibility;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      index: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    changes: [
      {
        field: { type: String, required: true },
        from: Schema.Types.Mixed,
        to: Schema.Types.Mixed,
      },
    ],
    metadata: Schema.Types.Mixed,
    visibility: {
      type: String,
      enum: ACTIVITY_VISIBILITIES,
      default: ACTIVITY_VISIBILITY.INTERNAL,
    },
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

activitySchema.index({ tenantId: 1, occurredAt: -1 });
activitySchema.index({ tenantId: 1, createdAt: -1 });
activitySchema.index({ tenantId: 1, projectId: 1 });
activitySchema.index({ tenantId: 1, targetType: 1, targetId: 1, occurredAt: -1 });
activitySchema.index({
  action: "text",
  targetType: "text",
  targetId: "text",
  summary: "text",
});

export const Activity = mongoose.model<IActivity>("Activity", activitySchema);
