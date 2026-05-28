import { orderQueue } from "../../infrastructure/queue/order.queue";
import {
  addOrderAttachments,
  createOrder,
  deleteOrderById,
  getOrderById,
  getOrdersByTenant,
  updateOrderInvoicePdf,
} from "./order.repository";
import { UserRole } from "../../common/interfaces/auth.interface";
import { getPaginationMeta } from "../../common/utils/pagination.util";
import { emitTenantNotification } from "../../infrastructure/socket/socket";
import { createAuditLog } from "../audit/audit.service";
import { Order } from "./order.model"; // 🔥 FIX
import { uploadToCloudinary } from "../../infrastructure/storage/cloudinary";

interface CreateOrderInput {
  productName: string;
  amount: number;
}

interface OrderListQuery {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
}

const generateOrderNumber = () => {
  return "ORD-" + Date.now();
};

const createOrderService = async (
  data: CreateOrderInput,
  userId: string,
  tenantId: string,
) => {
  const order = await createOrder({
    ...data,
    userId,
    tenantId,
    orderNumber: generateOrderNumber(),
  });

  console.log("📥 Adding job to queue...");

  await orderQueue.add(
    "process-order",
    {
      orderId: order._id.toString(),
      tenantId,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );

  console.log("✅ Job added");

  emitTenantNotification(tenantId, {
    type: "order.created",
    message: "A new order was created",
    data: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      productName: order.productName,
      amount: order.amount,
      status: order.status,
      userId,
    },
  });

  return order;
};

const getOrdersService = async (
  userId: string,
  tenantId: string,
  role: UserRole,
  query: OrderListQuery,
) => {
  if (role === "admin" || role === "manager") {
    const result = await getOrdersByTenant(tenantId, query);

    return {
      data: result.orders,
      pagination: getPaginationMeta(query.page, query.limit, result.total),
    };
  }

  const result = await getOrdersByTenant(tenantId, { ...query, userId });

  return {
    data: result.orders,
    pagination: getPaginationMeta(query.page, query.limit, result.total),
  };
};

const getOrderByIdService = async (
  orderId: string,
  userId: string,
  tenantId: string,
  role: UserRole,
) => {
  const order = await getOrderById(orderId);

  if (!order) {
    const error = new Error("Order not found") as any;
    error.statusCode = 404;
    throw error;
  }

  if (order.tenantId.toString() !== tenantId) {
    const error = new Error("Order not found") as any;
    error.statusCode = 404;
    throw error;
  }

  if (role === "user" && order.userId.toString() !== userId) {
    const error = new Error("Access denied") as any;
    error.statusCode = 403;
    throw error;
  }

  return {
    id: order._id.toString(),
    productName: order.productName,
    amount: order.amount,
    status: order.status,
    orderNumber: order.orderNumber,
  };
};

const deleteOrderService = async (
  orderId: string,
  tenantId: string,
  actorUserId: string,
) => {
  const order = await getOrderById(orderId);

  if (!order || order.tenantId.toString() !== tenantId) {
    const error = new Error("Order not found") as any;
    error.statusCode = 404;
    throw error;
  }

  await deleteOrderById(orderId);

  emitTenantNotification(tenantId, {
    type: "order.deleted",
    message: "An order was deleted",
    data: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      productName: order.productName,
      amount: order.amount,
      status: order.status,
    },
  });

  await createAuditLog({
    tenantId,
    actorUserId,
    action: "order.deleted",
    targetType: "order",
    targetId: order._id.toString(),
    details: {
      orderNumber: order.orderNumber,
      productName: order.productName,
      amount: order.amount,
      status: order.status,
    },
  });

  return {
    id: order._id.toString(),
    productName: order.productName,
    amount: order.amount,
    status: order.status,
    orderNumber: order.orderNumber,
  };
};

const uploadInvoicePdfService = async (
  orderId: string,
  tenantId: string,
  file: Express.Multer.File,
) => {
  const order = await getOrderById(orderId);

  if (!order || order.tenantId.toString() !== tenantId) {
    const error = new Error("Order not found") as any;
    error.statusCode = 404;
    throw error;
  }

  const uploaded = await uploadToCloudinary({
    buffer: file.buffer,
    folder: `backend-saas/${tenantId}/invoices`,
    resourceType: "raw",
    publicId: `${orderId}-invoice`,
  });

  const updatedOrder = await updateOrderInvoicePdf(orderId, {
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    originalName: file.originalname,
    uploadedAt: new Date(),
  });

  return updatedOrder;
};

const uploadOrderAttachmentsService = async (
  orderId: string,
  tenantId: string,
  files: Express.Multer.File[],
) => {
  const order = await getOrderById(orderId);

  if (!order || order.tenantId.toString() !== tenantId) {
    const error = new Error("Order not found") as any;
    error.statusCode = 404;
    throw error;
  }

  const attachments = await Promise.all(
    files.map(async (file, index) => {
      const uploaded = await uploadToCloudinary({
        buffer: file.buffer,
        folder: `backend-saas/${tenantId}/order-attachments`,
        resourceType: "auto",
        publicId: `${orderId}-${Date.now()}-${index}`,
      });

      return {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
      };
    }),
  );

  return addOrderAttachments(orderId, attachments);
};

export {
  createOrderService,
  getOrdersService,
  getOrderByIdService,
  deleteOrderService,
  uploadInvoicePdfService,
  uploadOrderAttachmentsService,
};
