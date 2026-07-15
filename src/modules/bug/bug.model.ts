import mongoose, { Schema, Document } from "mongoose";

import {
  BUG_STATUS,
  BUG_STATUSES,
  BugStatus,
} from "../../common/constants/bug-status";

import {
  SEVERITY,
  SEVERITIES,
  Severity,
} from "../../common/constants/severity";

export interface IBug extends Document {
  title: string;
  description: string;

  projectId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;

  tenantId: mongoose.Types.ObjectId;

  reportedBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;

  severity: Severity;
  status: BugStatus;

  createdAt: Date;
  updatedAt: Date;
}

const bugSchema = new Schema<IBug>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },

    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    severity: {
      type: String,
      enum: SEVERITIES,
      default: SEVERITY.MEDIUM,
    },

    status: {
      type: String,
      enum: BUG_STATUSES,
      default: BUG_STATUS.OPEN,
    },
  },
  {
    timestamps: true,
  },
);

// Helpful indexes for tenant-scoped SaaS queries
bugSchema.index({ tenantId: 1, createdAt: -1 });
bugSchema.index({ tenantId: 1, status: 1 });
bugSchema.index({ tenantId: 1, projectId: 1 });
bugSchema.index({ tenantId: 1, assignedTo: 1 });
bugSchema.index({
  title: "text",
  description: "text",
  status: "text",
  severity: "text",
});

export const Bug = mongoose.model<IBug>("Bug", bugSchema);
