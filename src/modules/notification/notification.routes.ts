import { Router } from "express";

import {
  authorizePermission,
  verifyToken,
} from "../../common/middleware/auth.middleware";
import { writeLimiter } from "../../common/middleware/rate-limit.middleware";
import { validate } from "../../common/middleware/validate.middleware";

import {
  archiveNotificationController,
  createNotificationController,
  deleteNotificationController,
  getNotificationByIdController,
  getNotificationsController,
  getUnreadNotificationCountController,
  markAllNotificationsReadController,
  markNotificationReadController,
} from "./notification.controller";
import {
  createNotificationSchema,
  notificationIdSchema,
  notificationListQuerySchema,
} from "./notification.validation";

const router = Router();

router.post(
  "/",
  writeLimiter,
  verifyToken,
  authorizePermission("create_notification"),
  validate({ body: createNotificationSchema }),
  createNotificationController,
);

router.get(
  "/",
  verifyToken,
  authorizePermission("view_notification"),
  validate({ query: notificationListQuerySchema }),
  getNotificationsController,
);

router.get(
  "/unread-count",
  verifyToken,
  authorizePermission("view_notification"),
  getUnreadNotificationCountController,
);

router.patch(
  "/read-all",
  writeLimiter,
  verifyToken,
  authorizePermission("update_notification"),
  markAllNotificationsReadController,
);

router.get(
  "/:id",
  verifyToken,
  authorizePermission("view_notification"),
  validate({ params: notificationIdSchema }),
  getNotificationByIdController,
);

router.patch(
  "/:id/read",
  writeLimiter,
  verifyToken,
  authorizePermission("update_notification"),
  validate({ params: notificationIdSchema }),
  markNotificationReadController,
);

router.patch(
  "/:id/archive",
  writeLimiter,
  verifyToken,
  authorizePermission("update_notification"),
  validate({ params: notificationIdSchema }),
  archiveNotificationController,
);

router.delete(
  "/:id",
  writeLimiter,
  verifyToken,
  authorizePermission("delete_notification"),
  validate({ params: notificationIdSchema }),
  deleteNotificationController,
);

export default router;
