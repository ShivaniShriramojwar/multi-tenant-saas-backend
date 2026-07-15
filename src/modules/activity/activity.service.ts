import { getPaginationMeta } from "../../common/utils/pagination.util";
import { AppError } from "../../common/errors/app-error";
import { getObjectIdString } from "../../common/utils/object-id.util";
import { getProjectByIdAndTenant } from "../project/project.repository";
import { getUserById } from "../user/user.repository";

import {
  createActivity,
  deleteActivityById,
  getActivities,
  getActivityById,
  getAuditTimeline,
} from "./activity.repository";
import {
  ActivityListQuery,
  ActivityTimelineItem,
  ActivityTimelineQuery,
  CreateActivityInput,
} from "./activity.types";

const createHttpError = (message: string, statusCode = 400) => {
  return new AppError(message, statusCode);
};

const validateTenantUser = async (userId: string, tenantId: string) => {
  const user = await getUserById(userId);

  if (!user || getObjectIdString(user.tenantId) !== tenantId) {
    throw createHttpError("Actor user not found", 404);
  }
};

const validateProject = async (
  projectId: string | undefined,
  tenantId: string,
) => {
  if (!projectId) {
    return;
  }

  const project = await getProjectByIdAndTenant(projectId, tenantId);

  if (!project) {
    throw createHttpError("Project not found", 404);
  }
};

const getActorName = (actor: any) => {
  return actor?.name || actor?.email || "Someone";
};

const quote = (value: unknown) => {
  return typeof value === "string" && value.trim() ? ` "${value}"` : "";
};

const formatAuditSummary = (log: any) => {
  const actorName = getActorName(log.actorUserId);
  const details = log.details || {};

  const summaries: Record<string, string> = {
    "project.created": `${actorName} created the project${quote(details.name || details.title)}`,
    "project.updated": `${actorName} updated the project${quote(details.name || details.title)}`,
    "project.deleted": `${actorName} deleted the project${quote(details.name || details.title)}`,
    "task.created": `${actorName} created task${quote(details.title)}`,
    "task.updated": `${actorName} updated task${quote(details.updatedTask?.title || details.title)}`,
    "task.deleted": `${actorName} deleted task${quote(details.title)}`,
    "task.assigned": `${actorName} assigned task${quote(details.taskTitle || details.title)}`,
    "task.status_changed": `${actorName} changed task status to ${details.newStatus || "a new status"}`,
    "bug.created": `${actorName} reported a ${details.severity || ""} bug${quote(details.title)}`.replace("  ", " "),
    "bug.updated": `${actorName} updated bug${quote(details.updatedBug?.title || details.title)}`,
    "bug.deleted": `${actorName} deleted bug${quote(details.title)}`,
    "bug.assigned": `${actorName} assigned the bug`,
    "bug.status_changed": `${actorName} changed bug status to ${details.newStatus || "a new status"}`,
    "comment.created": `${actorName} added a comment`,
    "comment.updated": `${actorName} updated a comment`,
    "comment.deleted": `${actorName} deleted a comment`,
    "document.uploaded": `${actorName} uploaded${quote(details.name || details.originalName)}`,
    "document.updated": `${actorName} updated document${quote(details.name || details.originalName)}`,
    "document.deleted": `${actorName} deleted document${quote(details.name || details.originalName)}`,
  };

  return summaries[log.action] || `${actorName} performed ${log.action}`;
};

const mapAuditLogToTimelineItem = (log: any): ActivityTimelineItem => {
  const actor = log.actorUserId;

  return {
    id: log._id.toString(),
    action: log.action,
    entityType: log.targetType,
    entityId: log.targetId,
    summary: formatAuditSummary(log),
    occurredAt: log.createdAt,
    actor: actor
      ? {
          id: actor._id.toString(),
          name: actor.name,
          email: actor.email,
          role: actor.role,
          profileImage: actor.profileImage,
        }
      : undefined,
    details: log.details,
  };
};

const createActivityService = async (
  data: CreateActivityInput,
  tenantId: string,
  currentUserId: string,
) => {
  const actorUserId = data.actorUserId || currentUserId;

  await validateTenantUser(actorUserId, tenantId);
  await validateProject(data.projectId, tenantId);

  return createActivity(tenantId, {
    ...data,
    actorUserId,
  });
};

const getActivitiesService = async (
  tenantId: string,
  query: ActivityListQuery,
) => {
  if (query.entityType && query.entityId) {
    return getActivityTimelineService(tenantId, {
      page: query.page,
      limit: query.limit,
      skip: query.skip,
      entityType: query.entityType,
      entityId: query.entityId,
    });
  }

  const result = await getActivities(tenantId, query);

  return {
    data: result.activities,
    pagination: getPaginationMeta(query.page, query.limit, result.total),
  };
};

const getActivityTimelineService = async (
  tenantId: string,
  query: ActivityTimelineQuery,
) => {
  const result = await getAuditTimeline(tenantId, query);

  return {
    data: result.logs.map(mapAuditLogToTimelineItem),
    pagination: getPaginationMeta(query.page, query.limit, result.total),
  };
};

const getActivityByIdService = async (activityId: string, tenantId: string) => {
  const activity = await getActivityById(activityId, tenantId);

  if (!activity) {
    throw createHttpError("Activity not found", 404);
  }

  return activity;
};

const deleteActivityService = async (
  activityId: string,
  tenantId: string,
) => {
  const activity = await deleteActivityById(activityId, tenantId);

  if (!activity) {
    throw createHttpError("Activity not found", 404);
  }

  return activity;
};

export {
  createActivityService,
  getActivitiesService,
  getActivityTimelineService,
  getActivityByIdService,
  deleteActivityService,
};
