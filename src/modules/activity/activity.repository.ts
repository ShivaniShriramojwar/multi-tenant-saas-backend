import { AuditLog } from "../audit/audit.model";
import { AuditTarget } from "../../common/constants/audit-targets";
import { Activity } from "./activity.model";
import {
  ActivityListQuery,
  ActivityTimelineQuery,
  CreateActivityInput,
} from "./activity.types";

const createActivity = async (tenantId: string, data: CreateActivityInput) => {
  return Activity.create({
    ...data,
    tenantId,
  });
};

const buildActivityFilter = (tenantId: string, query: ActivityListQuery) => {
  const filter: any = { tenantId };

  if (query.actorUserId) {
    filter.actorUserId = query.actorUserId;
  }

  if (query.action) {
    filter.action = query.action;
  }

  if (query.targetType) {
    filter.targetType = query.targetType;
  }

  if (query.targetId) {
    filter.targetId = query.targetId;
  }

  if (query.projectId) {
    filter.projectId = query.projectId;
  }

  if (query.visibility) {
    filter.visibility = query.visibility;
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

  if (query.search) {
    filter.$or = [
      { action: { $regex: query.search, $options: "i" } },
      { targetType: { $regex: query.search, $options: "i" } },
      { targetId: { $regex: query.search, $options: "i" } },
      { summary: { $regex: query.search, $options: "i" } },
    ];
  }

  return filter;
};

const getActivities = async (tenantId: string, query: ActivityListQuery) => {
  const filter = buildActivityFilter(tenantId, query);

  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .select("tenantId actorUserId action targetType targetId projectId visibility summary metadata occurredAt createdAt updatedAt")
      .populate("actorUserId", "name email role profileImage")
      .populate("projectId", "name status")
      .sort({ occurredAt: -1, createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .lean(),
    Activity.countDocuments(filter),
  ]);

  return { activities, total };
};

const getActivityById = async (activityId: string, tenantId: string) => {
  return Activity.findOne({ _id: activityId, tenantId })
    .select("-__v")
    .populate("actorUserId", "name email role profileImage")
    .populate("projectId", "name status");
};

const deleteActivityById = async (activityId: string, tenantId: string) => {
  return Activity.findOneAndDelete({ _id: activityId, tenantId });
};

const getAuditTimeline = async (
  tenantId: string,
  query: ActivityTimelineQuery,
) => {
  const targetType = query.entityType.toLowerCase() as AuditTarget;
  const targetMatches: any[] = [
    {
      targetType,
      targetId: query.entityId,
    },
  ];

  if (targetType === "project") {
    targetMatches.push(
      { "details.projectId": query.entityId },
      { "details.entityId": query.entityId },
    );
  }

  const filter = {
    tenantId,
    $or: targetMatches,
  };

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .select("tenantId actorUserId action targetType targetId details createdAt updatedAt")
      .populate("actorUserId", "name email role profileImage")
      .sort({ createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return { logs, total };
};

export {
  createActivity,
  getActivities,
  getActivityById,
  deleteActivityById,
  getAuditTimeline,
};
