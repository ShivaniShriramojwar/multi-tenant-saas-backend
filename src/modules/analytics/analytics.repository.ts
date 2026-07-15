import mongoose, { PipelineStage } from "mongoose";

import { AnalyticsEvent } from "./analytics.model";
import {
  AnalyticsAggregateQuery,
  AnalyticsEventListQuery,
  AnalyticsTrendInterval,
  CreateAnalyticsEventInput,
} from "./analytics.types";

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

const createAnalyticsEvent = async (
  tenantId: string,
  data: CreateAnalyticsEventInput,
) => {
  return AnalyticsEvent.create({
    ...data,
    tenantId,
  });
};

const buildAnalyticsFilter = (
  tenantId: string,
  query: AnalyticsEventListQuery | AnalyticsAggregateQuery,
) => {
  const filter: any = { tenantId: toObjectId(tenantId) };

  if (query.userId) {
    filter.userId = toObjectId(query.userId);
  }

  if (query.eventName) {
    filter.eventName = query.eventName;
  }

  if (query.entityType) {
    filter.entityType = query.entityType;
  }

  if (query.entityId) {
    filter.entityId = query.entityId;
  }

  if (query.fromDate || query.toDate) {
    filter.occurredAt = {};

    if (query.fromDate) {
      filter.occurredAt.$gte = query.fromDate;
    }

    if (query.toDate) {
      filter.occurredAt.$lte = query.toDate;
    }
  }

  if ("search" in query && query.search) {
    filter.$or = [
      { eventName: { $regex: query.search, $options: "i" } },
      { entityType: { $regex: query.search, $options: "i" } },
      { entityId: { $regex: query.search, $options: "i" } },
    ];
  }

  return filter;
};

const getAnalyticsEvents = async (
  tenantId: string,
  query: AnalyticsEventListQuery,
) => {
  const filter = buildAnalyticsFilter(tenantId, query);

  const [events, total] = await Promise.all([
    AnalyticsEvent.find(filter)
      .select("tenantId userId eventName entityType entityId metadata occurredAt createdAt updatedAt")
      .populate("userId", "name email role profileImage")
      .sort({ occurredAt: -1, createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .lean(),
    AnalyticsEvent.countDocuments(filter),
  ]);

  return { events, total };
};

const getAnalyticsEventById = async (eventId: string, tenantId: string) => {
  return AnalyticsEvent.findOne({
    _id: eventId,
    tenantId,
  })
    .select("-__v")
    .populate("userId", "name email role profileImage");
};

const getAnalyticsSummary = async (
  tenantId: string,
  query: AnalyticsAggregateQuery,
) => {
  const filter = buildAnalyticsFilter(tenantId, query);

  const [summary] = await AnalyticsEvent.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalEvents: { $sum: 1 },
        uniqueUsers: { $addToSet: "$userId" },
        eventNames: { $addToSet: "$eventName" },
        entityTypes: { $addToSet: "$entityType" },
        firstEventAt: { $min: "$occurredAt" },
        lastEventAt: { $max: "$occurredAt" },
      },
    },
    {
      $project: {
        _id: 0,
        totalEvents: 1,
        uniqueUsers: { $size: "$uniqueUsers" },
        uniqueEventNames: { $size: "$eventNames" },
        uniqueEntityTypes: {
          $size: {
            $filter: {
              input: "$entityTypes",
              as: "entityType",
              cond: { $ne: ["$$entityType", null] },
            },
          },
        },
        firstEventAt: 1,
        lastEventAt: 1,
      },
    },
  ]);

  return (
    summary || {
      totalEvents: 0,
      uniqueUsers: 0,
      uniqueEventNames: 0,
      uniqueEntityTypes: 0,
      firstEventAt: null,
      lastEventAt: null,
    }
  );
};

const getDateFormatForInterval = (interval: AnalyticsTrendInterval) => {
  if (interval === "hour") {
    return "%Y-%m-%d %H:00";
  }

  if (interval === "month") {
    return "%Y-%m";
  }

  return "%Y-%m-%d";
};

const getAnalyticsTrend = async (
  tenantId: string,
  query: AnalyticsAggregateQuery,
  interval: AnalyticsTrendInterval,
) => {
  const filter = buildAnalyticsFilter(tenantId, query);
  const format = getDateFormatForInterval(interval);

  return AnalyticsEvent.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          $dateToString: {
            format,
            date: "$occurredAt",
            timezone: "UTC",
          },
        },
        count: { $sum: 1 },
      },
    },
    { $project: { _id: 0, period: "$_id", count: 1 } },
    { $sort: { period: 1 } },
  ]);
};

const getTopAnalyticsEvents = async (
  tenantId: string,
  query: AnalyticsAggregateQuery,
  limit: number,
) => {
  const filter = buildAnalyticsFilter(tenantId, query);

  return AnalyticsEvent.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$eventName",
        count: { $sum: 1 },
        lastEventAt: { $max: "$occurredAt" },
      },
    },
    { $project: { _id: 0, eventName: "$_id", count: 1, lastEventAt: 1 } },
    { $sort: { count: -1, eventName: 1 } },
    { $limit: limit },
  ] as PipelineStage[]);
};

export {
  createAnalyticsEvent,
  getAnalyticsEvents,
  getAnalyticsEventById,
  getAnalyticsSummary,
  getAnalyticsTrend,
  getTopAnalyticsEvents,
};
