import { orderQueue } from "../../infrastructure/queue/order.queue";
import { logger } from "../../common/logger";
import { ForbiddenError, NotFoundError } from "../../common/errors/app-error";
import {
  addOrderAttachments,
  createOrder,
  deleteOrderById,
  getOrderById,
  getOrdersByTenant,
  updateOrderInvoicePdf,
} from "./order.repository";

import { getPaginationMeta } from "../../common/utils/pagination.util";
import { emitTenantNotification } from "../../infrastructure/socket/socket";
import { createAuditLog } from "../audit/audit.service";

import { uploadToS3 } from "../../infrastructure/storage/s3";
import { ROLES, UserRole } from "../../common/constants/roles";
import { DOCUMENT_CATEGORY } from "../../common/constants/document-category";
import { ENTITY_TYPE } from "../../common/constants/entity-type";
import {
  createS3ObjectKey,
  FILE_UPLOAD_RULES,
  validateUploadFile,
} from "../../common/utils/file-security.util";
import { createDocument } from "../document/document.repository";

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

  logger.info(
    { orderId: order._id.toString(), tenantId, userId },
    "Adding order job to queue",
  );

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

  logger.info(
    { orderId: order._id.toString(), tenantId, userId },
    "Order job added to queue",
  );

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
  if (
    role === ROLES.SUPER_ADMIN ||
    role === ROLES.HEAD_PRODUCT_MANAGER ||
    role === ROLES.TEAM_LEAD
  ) {
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
    throw new NotFoundError("Order not found");
  }

  if (order.tenantId.toString() !== tenantId) {
    throw new NotFoundError("Order not found");
  }

  if (
    (role === ROLES.DEVELOPER || role === ROLES.TESTER) &&
    order.userId.toString() !== userId
  ) {
    throw new ForbiddenError("Access denied");
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
    throw new NotFoundError("Order not found");
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
  actorUserId: string,
  file: Express.Multer.File,
) => {
  const order = await getOrderById(orderId);

  if (!order || order.tenantId.toString() !== tenantId) {
    throw new NotFoundError("Order not found");
  }

  const folder = `backend-saas/${tenantId}/invoices`;
  const { extension } = validateUploadFile(file, FILE_UPLOAD_RULES.pdf);
  const key = createS3ObjectKey(folder, `${orderId}-invoice`, file.originalname);

  const uploaded = await uploadToS3({
    buffer: file.buffer,
    key,
    contentType: file.mimetype,
  });

  const updatedOrder = await updateOrderInvoicePdf(orderId, {
    url: uploaded.url,
    publicId: uploaded.key,
    originalName: file.originalname,
    uploadedAt: new Date(),
  });

  await createDocument({
    name: file.originalname,
    originalName: file.originalname,
    url: uploaded.url,
    publicId: uploaded.key,
    resourceType: "s3",
    mimeType: file.mimetype,
    extension,
    size: file.size,
    category: DOCUMENT_CATEGORY.INVOICE,
    tags: ["invoice"],
    tenantId,
    entityType: ENTITY_TYPE.ORDER,
    entityId: orderId,
    uploadedBy: actorUserId,
    folder,
  });

  return updatedOrder;
};

const uploadOrderAttachmentsService = async (
  orderId: string,
  tenantId: string,
  actorUserId: string,
  files: Express.Multer.File[],
) => {
  const order = await getOrderById(orderId);

  if (!order || order.tenantId.toString() !== tenantId) {
    throw new NotFoundError("Order not found");
  }

  const attachments = await Promise.all(
    files.map(async (file, index) => {
      const folder = `backend-saas/${tenantId}/order-attachments`;
      const { extension } = validateUploadFile(file, FILE_UPLOAD_RULES.attachment);
      const key = createS3ObjectKey(
        folder,
        `${orderId}-${index}`,
        file.originalname,
      );
      const uploaded = await uploadToS3({
        buffer: file.buffer,
        key,
        contentType: file.mimetype,
      });

      return {
        uploaded,
        folder,
        extension,
        url: uploaded.url,
        publicId: uploaded.key,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
      };
    }),
  );

  await Promise.all(
    attachments.map((attachment) =>
      createDocument({
        name: attachment.originalName,
        originalName: attachment.originalName,
        url: attachment.url,
        publicId: attachment.publicId,
        resourceType: "s3",
        mimeType: attachment.mimeType,
        extension: attachment.extension,
        size: attachment.size,
        category: DOCUMENT_CATEGORY.ORDER_ATTACHMENT,
        tags: ["order", "attachment"],
        tenantId,
        entityType: ENTITY_TYPE.ORDER,
        entityId: orderId,
        uploadedBy: actorUserId,
        folder: attachment.folder,
      }),
    ),
  );

  return addOrderAttachments(
    orderId,
    attachments.map((attachment) => ({
      url: attachment.url,
      publicId: attachment.publicId,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      uploadedAt: attachment.uploadedAt,
    })),
  );
};

export {
  createOrderService,
  getOrdersService,
  getOrderByIdService,
  deleteOrderService,
  uploadInvoicePdfService,
  uploadOrderAttachmentsService,
};
