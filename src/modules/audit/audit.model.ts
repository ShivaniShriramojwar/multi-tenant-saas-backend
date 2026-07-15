import mongoose, { Document, Schema } from "mongoose";
import {
  AUDIT_ACTION,
  AuditAction,
} from "../../common/constants/audit-actions";
import {
  AUDIT_TARGETS,
  AuditTarget,
} from "../../common/constants/audit-targets";

interface IAuditLog extends Document {
  tenantId: mongoose.Types.ObjectId;
  actorUserId: mongoose.Types.ObjectId;
  action: AuditAction;
  targetType: AuditTarget;
  targetId?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
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
      enum: Object.values(AUDIT_ACTION),
      required: true,
      index: true,
    },

    targetType: {
      type: String,
      enum: AUDIT_TARGETS,
      required: true,
    },

    targetId: String,

    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

auditLogSchema.index({
  tenantId: 1,
  createdAt: -1,
});

const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

export { AuditLog, IAuditLog };
