import { Router } from "express";
import {
  authorizePermission,
  verifyToken,
} from "../../common/middleware/auth.middleware";
import { writeLimiter } from "../../common/middleware/rate-limit.middleware";
import {
  attachmentUpload,
  pdfUpload,
} from "../../common/middleware/upload.middleware";
import {
  createOrderController,
  deleteOrderController,
  getOrderByIdController,
  getOrdersController,
  uploadInvoicePdfController,
  uploadOrderAttachmentsController,
} from "./order.controller";

const router = Router();

// 🔥 Create order
router.post("/", writeLimiter, verifyToken, authorizePermission("create_order"), createOrderController);

// 🔥 Get tenant orders
router.get("/", verifyToken, getOrdersController);

// 🔥 Get order by ID
router.get("/:id", verifyToken, getOrderByIdController);

// 🔥 Upload invoice PDF
router.post(
  "/:id/invoice",
  writeLimiter,
  verifyToken,
  authorizePermission("create_order"),
  pdfUpload.single("invoice"),
  uploadInvoicePdfController,
);

// 🔥 Upload order/product attachments
router.post(
  "/:id/attachments",
  writeLimiter,
  verifyToken,
  authorizePermission("create_order"),
  attachmentUpload.array("attachments", 5),
  uploadOrderAttachmentsController,
);

// 🔥 Delete order
router.delete("/:id", writeLimiter, verifyToken, authorizePermission("delete_order"), deleteOrderController);

console.log("Order routes loaded: DELETE /api/v1/orders/:id");
export default router;
