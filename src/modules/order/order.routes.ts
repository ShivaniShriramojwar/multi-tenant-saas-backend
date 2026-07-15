import { Router } from "express";

import {
  verifyToken,
  authorizePermission,
} from "../../common/middleware/auth.middleware";

import { writeLimiter } from "../../common/middleware/rate-limit.middleware";
import { validate } from "../../common/middleware/validate.middleware";

import {
  attachmentUpload,
  pdfUpload,
} from "../../common/middleware/upload.middleware";

import {
  createOrderController,
  getOrdersController,
  getOrderByIdController,
  deleteOrderController,
  uploadInvoicePdfController,
  uploadOrderAttachmentsController,
} from "./order.controller";
import {
  createOrderSchema,
  getOrdersQuerySchema,
  orderIdSchema,
} from "./order.validation";

const router = Router();

/**
 * ==========================================================
 * Orders
 * ==========================================================
 */

// Create Order
router.post(
  "/",
  writeLimiter,
  verifyToken,
  authorizePermission("create_order"),
  validate({ body: createOrderSchema }),
  createOrderController,
);

// Get All Orders
router.get(
  "/",
  verifyToken,
  authorizePermission("view_orders"),
  validate({ query: getOrdersQuerySchema }),
  getOrdersController,
);

// Get Order By ID
router.get(
  "/:id",
  verifyToken,
  authorizePermission("view_orders"),
  validate({ params: orderIdSchema }),
  getOrderByIdController,
);

// Upload Invoice PDF
router.post(
  "/:id/invoice",
  writeLimiter,
  verifyToken,
  authorizePermission("create_order"),
  validate({ params: orderIdSchema }),
  pdfUpload.single("invoice"),
  uploadInvoicePdfController,
);

// Upload Attachments
router.post(
  "/:id/attachments",
  writeLimiter,
  verifyToken,
  authorizePermission("create_order"),
  validate({ params: orderIdSchema }),
  attachmentUpload.array("attachments", 5),
  uploadOrderAttachmentsController,
);

// Delete Order
router.delete(
  "/:id",
  writeLimiter,
  verifyToken,
  authorizePermission("delete_order"),
  validate({ params: orderIdSchema }),
  deleteOrderController,
);

export default router;
