import mongoose, { Schema, Document } from "mongoose";
import {
  ORDER_STATUS,
  ORDER_STATUSES,
  OrderStatus,
} from "../../common/constants/order-status";
import {
  PAYMENT_STATUS,
  PAYMENT_STATUSES,
  PaymentStatus,
} from "../../common/constants/payment-status";

interface IOrder extends Document {
  productName: string;
  amount: number;
  status: OrderStatus;

  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  orderNumber: string;

  paymentStatus: PaymentStatus;

  metadata?: Record<string, unknown>;
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

const orderSchema = new Schema<IOrder>(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: ORDER_STATUS.PENDING,
    },

    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: PAYMENT_STATUS.PENDING,
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

orderSchema.index({
  tenantId: 1,
  createdAt: -1,
});
orderSchema.index({
  tenantId: 1,
  status: 1,
  createdAt: -1,
});
orderSchema.index({ tenantId: 1, userId: 1 });
orderSchema.index({
  productName: "text",
  orderNumber: "text",
  status: "text",
  paymentStatus: "text",
});

export const Order = mongoose.model<IOrder>("Order", orderSchema);
