import { NextFunction, Response } from "express";

import { AuthRequest } from "../../common/interfaces/auth.interface";
import { getPagination } from "../../common/utils/pagination.util";

import {
  createActivityService,
  deleteActivityService,
  getActivitiesService,
  getActivityByIdService,
} from "./activity.service";
import { z } from "zod";
import {
  activityListQuerySchema,
  activityTargetParamsSchema,
} from "./activity.validation";

type ActivityListQuery = z.infer<typeof activityListQuerySchema>;
type ActivityTargetParams = z.infer<typeof activityTargetParamsSchema>;

const createActivityController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const activity = await createActivityService(
      req.body,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(201).json({
      message: "Activity created successfully",
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

const getActivitiesController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pagination = getPagination(req.query);
    const filters = req.query as ActivityListQuery;
    const targetType = filters.entityType || filters.targetType;
    const targetId = filters.entityId || filters.targetId;
    const { data, pagination: paginationMeta } = await getActivitiesService(
      req.user!.tenantId,
      {
        ...pagination,
        ...filters,
        targetType,
        targetId,
      },
    );

    return res.status(200).json({
      message: filters.entityType && filters.entityId
        ? "Activity timeline fetched successfully"
        : "Activities fetched successfully",
      data,
      pagination: paginationMeta,
    });
  } catch (error) {
    next(error);
  }
};

const getTargetActivitiesController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pagination = getPagination(req.query);
    const filters = req.query as ActivityListQuery;
    const params = req.params as ActivityTargetParams;
    const { data, pagination: paginationMeta } = await getActivitiesService(
      req.user!.tenantId,
      {
        ...pagination,
        ...filters,
        ...params,
      },
    );

    return res.status(200).json({
      message: "Target activities fetched successfully",
      data,
      pagination: paginationMeta,
    });
  } catch (error) {
    next(error);
  }
};

const getActivityByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const activity = await getActivityByIdService(
      req.params.id,
      req.user!.tenantId,
    );

    return res.status(200).json({
      message: "Activity fetched successfully",
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

const deleteActivityController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const activity = await deleteActivityService(
      req.params.id,
      req.user!.tenantId,
    );

    return res.status(200).json({
      message: "Activity deleted successfully",
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createActivityController,
  getActivitiesController,
  getTargetActivitiesController,
  getActivityByIdController,
  deleteActivityController,
};
