import mongoose, { Schema, Document } from "mongoose";

enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}
interface OrderDocument extends Document {
  productName: string;
  amount: number;
  status: OrderStatus;

  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  orderNumber: string;

  paymentStatus: "pending" | "paid" | "failed";

  metadata?: Record<string, any>;
  invoicePdf?: {
    url: string;
    publicId: string;
    originalName: string;
    uploadedAt: Date;
  };
  attachments?: Array<{
    url: string;
    publicId: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: Date;
  }>;

  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<OrderDocument>(
  {
    productName: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(OrderStatus), // ✅ correct place
      default: OrderStatus.PENDING,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    orderNumber: {
      type: String,
      unique: true,
    },

    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true, // 🔥 important for SaaS
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    metadata: {
      type: Schema.Types.Mixed, // flexible field
    },

    invoicePdf: {
      url: String,
      publicId: String,
      originalName: String,
      uploadedAt: Date,
    },

    attachments: [
      {
        url: String,
        publicId: String,
        originalName: String,
        mimeType: String,
        size: Number,
        uploadedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ tenantId: 1, createdAt: -1 });

const Order = mongoose.model<OrderDocument>("Order", orderSchema);

export { Order };
