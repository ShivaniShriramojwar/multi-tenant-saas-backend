import { NextFunction, Response } from "express";

import { AuthRequest } from "../../common/interfaces/auth.interface";
import { getPagination } from "../../common/utils/pagination.util";

import {
  archiveNotificationService,
  createNotificationService,
  deleteNotificationService,
  getNotificationByIdService,
  getNotificationsService,
  getUnreadNotificationCountService,
  markAllNotificationsReadService,
  markNotificationReadService,
} from "./notification.service";

const createNotificationController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const notification = await createNotificationService(
      req.body,
      req.user!.tenantId,
    );

    return res.status(201).json({
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

const getNotificationsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pagination = getPagination(req.query);
    const filters = req.query;
    const { data, pagination: paginationMeta } = await getNotificationsService(
      req.user!.tenantId,
      req.user!.userId,
      {
        ...pagination,
        ...filters,
      },
    );

    return res.status(200).json({
      message: "Notifications fetched successfully",
      data,
      pagination: paginationMeta,
    });
  } catch (error) {
    next(error);
  }
};

const getNotificationByIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const notification = await getNotificationByIdService(
      req.params.id,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Notification fetched successfully",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadNotificationCountController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await getUnreadNotificationCountService(
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Unread notification count fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const markNotificationReadController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const notification = await markNotificationReadService(
      req.params.id,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsReadController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await markAllNotificationsReadService(
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Notifications marked as read",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const archiveNotificationController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const notification = await archiveNotificationService(
      req.params.id,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Notification archived successfully",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

const deleteNotificationController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const notification = await deleteNotificationService(
      req.params.id,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Notification deleted successfully",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createNotificationController,
  getNotificationsController,
  getNotificationByIdController,
  getUnreadNotificationCountController,
  markNotificationReadController,
  markAllNotificationsReadController,
  archiveNotificationController,
  deleteNotificationController,
};
