import { UpdateQuery } from "mongoose";

import { Notification, INotification } from "./notification.model";
import {
  CreateNotificationInput,
  NotificationListQuery,
} from "./notification.types";

const createNotification = async (
  tenantId: string,
  data: CreateNotificationInput,
) => {
  return Notification.create({
    ...data,
    tenantId,
  });
};

const buildNotificationFilter = (
  tenantId: string,
  recipientId: string,
  query: NotificationListQuery,
) => {
  const filter: any = {
    tenantId,
    recipientId,
  };

  if (query.archived === true) {
    filter.archivedAt = { $ne: null };
  } else if (query.archived === false || query.archived === undefined) {
    filter.archivedAt = null;
  }

  if (query.readStatus === "read") {
    filter.readAt = { $ne: null };
  }

  if (query.readStatus === "unread") {
    filter.readAt = null;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.type) {
    filter.type = query.type;
  }

  if (query.entityType) {
    filter.entityType = query.entityType;
  }

  if (query.entityId) {
    filter.entityId = query.entityId;
  }

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: "i" } },
      { message: { $regex: query.search, $options: "i" } },
      { type: { $regex: query.search, $options: "i" } },
    ];
  }

  return filter;
};

const getNotifications = async (
  tenantId: string,
  recipientId: string,
  query: NotificationListQuery,
) => {
  const filter = buildNotificationFilter(tenantId, recipientId, query);

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .select("tenantId recipientId actorUserId type title message priority entityType entityId readAt archivedAt createdAt updatedAt")
      .populate("recipientId", "name email profileImage")
      .populate("actorUserId", "name email profileImage")
      .sort({ createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  return { notifications, total };
};

const getNotificationByIdForRecipient = async (
  notificationId: string,
  tenantId: string,
  recipientId: string,
) => {
  return Notification.findOne({
    _id: notificationId,
    tenantId,
    recipientId,
  })
    .populate("recipientId", "name email profileImage")
    .populate("actorUserId", "name email profileImage");
};

const countUnreadNotifications = async (
  tenantId: string,
  recipientId: string,
) => {
  return Notification.countDocuments({
    tenantId,
    recipientId,
    readAt: null,
    archivedAt: null,
  });
};

const updateNotificationForRecipient = async (
  notificationId: string,
  tenantId: string,
  recipientId: string,
  update: UpdateQuery<INotification>,
) => {
  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      tenantId,
      recipientId,
    },
    update,
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("recipientId", "name email profileImage")
    .populate("actorUserId", "name email profileImage");
};

const markAllNotificationsRead = async (
  tenantId: string,
  recipientId: string,
) => {
  return Notification.updateMany(
    {
      tenantId,
      recipientId,
      readAt: null,
      archivedAt: null,
    },
    {
      $set: {
        readAt: new Date(),
      },
    },
  );
};

const deleteNotificationForRecipient = async (
  notificationId: string,
  tenantId: string,
  recipientId: string,
) => {
  return Notification.findOneAndDelete({
    _id: notificationId,
    tenantId,
    recipientId,
  });
};

export {
  createNotification,
  getNotifications,
  getNotificationByIdForRecipient,
  countUnreadNotifications,
  updateNotificationForRecipient,
  markAllNotificationsRead,
  deleteNotificationForRecipient,
};
