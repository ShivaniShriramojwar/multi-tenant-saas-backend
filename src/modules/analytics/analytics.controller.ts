import { NextFunction, Response } from "express";

import { AuthRequest } from "../../common/interfaces/auth.interface";
import { getPagination } from "../../common/utils/pagination.util";

import {
  createAnalyticsEventService,
  getAnalyticsEventByIdService,
  getAnalyticsEventsService,
  getAnalyticsSummaryService,
  getAnalyticsTrendService,
  getTopAnalyticsEventsService,
} from "./analytics.service";
import { z } from "zod";
import {
  analyticsAggregateQuerySchema,
  analyticsListQuerySchema,
  analyticsTrendQuerySchema,
  topAnalyticsEventsQuerySchema,
} from "./analytics.validation";

type AnalyticsListQuery = z.infer<typeof analyticsListQuerySchema>;
type AnalyticsAggregateQuery = z.infer<typeof analyticsAggregateQuerySchema>;
type AnalyticsTrendQuery = z.infer<typeof analyticsTrendQuerySchema>;
type TopAnalyticsEventsQuery = z.infer<typeof topAnalyticsEventsQuerySchema>;

const createAnalyticsEventController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const event = await createAnalyticsEventService(
      req.body,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(201).json({
      message: "Analytics event created successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

const getAnalyticsEventsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pagination = getPagination(req.query);
    const filters = req.query as AnalyticsListQuery;
    const { data, pagination: paginationMeta } =
      await getAnalyticsEventsService(req.user!.tenantId, {
        ...pagination,
        ...filters,
      });

    return res.status(200).json({
      message: "Analytics events fetched successfully",
      data,
      pagination: paginationMeta,
    });
  } catch (error) {
    next(error);
  }
};

const getAnalyticsEventByIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const event = await getAnalyticsEventByIdService(
      req.params.id,
      req.user!.tenantId,
    );

    return res.status(200).json({
      message: "Analytics event fetched successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

const getAnalyticsSummaryController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filters = req.query as AnalyticsAggregateQuery;
    const data = await getAnalyticsSummaryService(
      req.user!.tenantId,
      filters,
    );

    return res.status(200).json({
      message: "Analytics summary fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getAnalyticsTrendController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filters = req.query as unknown as AnalyticsTrendQuery;
    const data = await getAnalyticsTrendService(req.user!.tenantId, filters);

    return res.status(200).json({
      message: "Analytics trend fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getTopAnalyticsEventsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filters = req.query as unknown as TopAnalyticsEventsQuery;
    const limit = filters.limit;
    const data = await getTopAnalyticsEventsService(
      req.user!.tenantId,
      filters,
      limit,
    );

    return res.status(200).json({
      message: "Top analytics events fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createAnalyticsEventController,
  getAnalyticsEventsController,
  getAnalyticsEventByIdController,
  getAnalyticsSummaryController,
  getAnalyticsTrendController,
  getTopAnalyticsEventsController,
};
