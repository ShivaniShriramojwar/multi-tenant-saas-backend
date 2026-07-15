import { getPaginationMeta } from "../../common/utils/pagination.util";
import { AppError } from "../../common/errors/app-error";
import { getObjectIdString } from "../../common/utils/object-id.util";
import { emitUserNotification } from "../../infrastructure/socket/socket";
import { getUserById } from "../user/user.repository";

import {
  countUnreadNotifications,
  createNotification,
  deleteNotificationForRecipient,
  getNotificationByIdForRecipient,
  getNotifications,
  markAllNotificationsRead,
  updateNotificationForRecipient,
} from "./notification.repository";
import {
  CreateNotificationInput,
  NotificationListQuery,
} from "./notification.types";

const createHttpError = (message: string, statusCode = 400) => {
  return new AppError(message, statusCode);
};

const validateTenantUser = async (
  userId: string | undefined,
  tenantId: string,
  notFoundMessage: string,
) => {
  if (!userId) {
    return;
  }

  const user = await getUserById(userId);

  if (!user || getObjectIdString(user.tenantId) !== tenantId) {
    throw createHttpError(notFoundMessage, 404);
  }
};

const createNotificationService = async (
  data: CreateNotificationInput,
  tenantId: string,
) => {
  await validateTenantUser(data.recipientId, tenantId, "Recipient not found");
  await validateTenantUser(data.actorUserId, tenantId, "Actor user not found");

  const notification = await createNotification(tenantId, data);

  emitUserNotification(data.recipientId, {
    type: notification.type,
    message: notification.message,
    data: {
      notificationId: notification._id.toString(),
      title: notification.title,
      priority: notification.priority,
      entityType: notification.entityType,
      entityId: notification.entityId,
    },
  });

  return notification;
};

const getNotificationsService = async (
  tenantId: string,
  recipientId: string,
  query: NotificationListQuery,
) => {
  const result = await getNotifications(tenantId, recipientId, query);

  return {
    data: result.notifications,
    pagination: getPaginationMeta(query.page, query.limit, result.total),
  };
};

const getNotificationByIdService = async (
  notificationId: string,
  tenantId: string,
  recipientId: string,
) => {
  const notification = await getNotificationByIdForRecipient(
    notificationId,
    tenantId,
    recipientId,
  );

  if (!notification) {
    throw createHttpError("Notification not found", 404);
  }

  return notification;
};

const getUnreadNotificationCountService = async (
  tenantId: string,
  recipientId: string,
) => {
  const unreadCount = await countUnreadNotifications(tenantId, recipientId);

  return { unreadCount };
};

const markNotificationReadService = async (
  notificationId: string,
  tenantId: string,
  recipientId: string,
) => {
  const notification = await updateNotificationForRecipient(
    notificationId,
    tenantId,
    recipientId,
    {
      $set: {
        readAt: new Date(),
      },
    },
  );

  if (!notification) {
    throw createHttpError("Notification not found", 404);
  }

  return notification;
};

const markAllNotificationsReadService = async (
  tenantId: string,
  recipientId: string,
) => {
  const result = await markAllNotificationsRead(tenantId, recipientId);

  return {
    modifiedCount: result.modifiedCount,
  };
};

const archiveNotificationService = async (
  notificationId: string,
  tenantId: string,
  recipientId: string,
) => {
  const notification = await updateNotificationForRecipient(
    notificationId,
    tenantId,
    recipientId,
    {
      $set: {
        archivedAt: new Date(),
      },
    },
  );

  if (!notification) {
    throw createHttpError("Notification not found", 404);
  }

  return notification;
};

const deleteNotificationService = async (
  notificationId: string,
  tenantId: string,
  recipientId: string,
) => {
  const notification = await deleteNotificationForRecipient(
    notificationId,
    tenantId,
    recipientId,
  );

  if (!notification) {
    throw createHttpError("Notification not found", 404);
  }

  return notification;
};

export {
  createNotificationService,
  getNotificationsService,
  getNotificationByIdService,
  getUnreadNotificationCountService,
  markNotificationReadService,
  markAllNotificationsReadService,
  archiveNotificationService,
  deleteNotificationService,
};
