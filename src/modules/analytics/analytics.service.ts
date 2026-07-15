import mongoose from "mongoose";
import { AppError } from "../../common/errors/app-error";

import { getPaginationMeta } from "../../common/utils/pagination.util";
import { getObjectIdString } from "../../common/utils/object-id.util";
import { getUserById } from "../user/user.repository";

import {
  createAnalyticsEvent,
  getAnalyticsEventById,
  getAnalyticsEvents,
  getAnalyticsSummary,
  getAnalyticsTrend,
  getTopAnalyticsEvents,
} from "./analytics.repository";
import {
  AnalyticsAggregateQuery,
  AnalyticsEventListQuery,
  AnalyticsTrendQuery,
  CreateAnalyticsEventInput,
} from "./analytics.types";

const createHttpError = (message: string, statusCode = 400) => {
  return new AppError(message, statusCode);
};

const assertValidObjectId = (id: string, label: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(`Invalid ${label}`, 400);
  }
};

const validateTenantUser = async (userId: string, tenantId: string) => {
  assertValidObjectId(userId, "user ID");

  const user = await getUserById(userId);

  if (!user || getObjectIdString(user.tenantId) !== tenantId) {
    throw createHttpError("User not found", 404);
  }
};

const validateQueryIds = async (
  query: AnalyticsEventListQuery | AnalyticsAggregateQuery,
  tenantId: string,
) => {
  if (query.userId) {
    await validateTenantUser(query.userId, tenantId);
  }
};

const createAnalyticsEventService = async (
  data: CreateAnalyticsEventInput,
  tenantId: string,
  currentUserId: string,
) => {
  const userId = data.userId || currentUserId;

  await validateTenantUser(userId, tenantId);

  return createAnalyticsEvent(tenantId, {
    ...data,
    userId,
  });
};

const getAnalyticsEventsService = async (
  tenantId: string,
  query: AnalyticsEventListQuery,
) => {
  await validateQueryIds(query, tenantId);

  const result = await getAnalyticsEvents(tenantId, query);

  return {
    data: result.events,
    pagination: getPaginationMeta(query.page, query.limit, result.total),
  };
};

const getAnalyticsEventByIdService = async (
  eventId: string,
  tenantId: string,
) => {
  assertValidObjectId(eventId, "analytics event ID");

  const event = await getAnalyticsEventById(eventId, tenantId);

  if (!event) {
    throw createHttpError("Analytics event not found", 404);
  }

  return event;
};

const getAnalyticsSummaryService = async (
  tenantId: string,
  query: AnalyticsAggregateQuery,
) => {
  await validateQueryIds(query, tenantId);

  return getAnalyticsSummary(tenantId, query);
};

const getAnalyticsTrendService = async (
  tenantId: string,
  query: AnalyticsTrendQuery,
) => {
  await validateQueryIds(query, tenantId);

  return getAnalyticsTrend(tenantId, query, query.interval);
};

const getTopAnalyticsEventsService = async (
  tenantId: string,
  query: AnalyticsAggregateQuery,
  limit: number,
) => {
  await validateQueryIds(query, tenantId);

  return getTopAnalyticsEvents(tenantId, query, limit);
};

export {
  createAnalyticsEventService,
  getAnalyticsEventsService,
  getAnalyticsEventByIdService,
  getAnalyticsSummaryService,
  getAnalyticsTrendService,
  getTopAnalyticsEventsService,
};
