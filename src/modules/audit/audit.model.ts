import mongoose, { Document, Schema } from "mongoose";

type AuditAction =
  | "user.created"
  | "user.role_changed"
  | "order.deleted"
  | "permission.updated";

interface IAuditLog extends Document {
  tenantId: mongoose.Types.ObjectId;
  actorUserId: mongoose.Types.ObjectId;
  action: AuditAction;
  targetType: "user" | "order" | "permission";
  targetId?: string;
  details?: Record<string, any>;
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
      enum: ["user.created", "user.role_changed", "order.deleted", "permission.updated"],
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["user", "order", "permission"],
      required: true,
    },
    targetId: {
      type: String,
    },
    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

auditLogSchema.index({ tenantId: 1, createdAt: -1 });

const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

export { AuditLog, AuditAction, IAuditLog };
