import mongoose, { Document, Schema } from "mongoose";

export const EMAIL_STATUS = {
  QUEUED: "queued",
  SENT: "sent",
  FAILED: "failed",
} as const;

export type EmailStatus = (typeof EMAIL_STATUS)[keyof typeof EMAIL_STATUS];

export interface IEmailLog extends Document {
  tenantId: mongoose.Types.ObjectId;
  requestedBy?: mongoose.Types.ObjectId;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  templateKey?: string;
  status: EmailStatus;
  providerMessageId?: string;
  errorMessage?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emailLogSchema = new Schema<IEmailLog>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    to: {
      type: [String],
      required: true,
    },
    cc: [String],
    bcc: [String],
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    templateKey: String,
    status: {
      type: String,
      enum: Object.values(EMAIL_STATUS),
      default: EMAIL_STATUS.QUEUED,
      index: true,
    },
    providerMessageId: String,
    errorMessage: String,
    sentAt: Date,
  },
  {
    timestamps: true,
  },
);

emailLogSchema.index({ tenantId: 1, createdAt: -1 });
emailLogSchema.index({ tenantId: 1, status: 1 });
emailLogSchema.index({
  subject: "text",
  to: "text",
  cc: "text",
  bcc: "text",
  templateKey: "text",
  status: "text",
});

export const EmailLog = mongoose.model<IEmailLog>("EmailLog", emailLogSchema);
