import { AnalyticsEvent } from "../analytics/analytics.model";
import { Activity } from "../activity/activity.model";
import { Bug } from "../bug/bug.model";
import { Comment } from "../comment/comment.model";
import { ProjectDocument } from "../document/document.model";
import { EmailLog } from "../email/email.model";
import { Notification } from "../notification/notification.model";
import { Order } from "../order/order.model";
import { Project } from "../project/project.model";
import { Task } from "../task/task.model";
import { User } from "../user/user.model";
import {
  SearchQuery,
  SearchResourceType,
  SearchResultItem,
  SearchResultsByType,
} from "./search.types";

const toDate = (value: unknown): Date | undefined => {
  return value instanceof Date ? value : undefined;
};

const createTextFilter = (query: string) => {
  return { $text: { $search: query } };
};

const searchProjects = async (
  tenantId: string,
  query: SearchQuery,
): Promise<SearchResultItem[]> => {
  const projects = await Project.find({
    tenantId,
    ...createTextFilter(query.q),
  })
    .select("name description status createdAt updatedAt")
    .select({ score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" }, updatedAt: -1 })
    .skip(query.skip)
    .limit(query.limit)
    .lean();

  return projects.map((project: any) => ({
    id: project._id.toString(),
    type: "projects",
    title: project.name,
    description: project.description,
    status: project.status,
    createdAt: toDate(project.createdAt),
    updatedAt: toDate(project.updatedAt),
  }));
};

const searchTasks = async (
  tenantId: string,
  query: SearchQuery,
): Promise<SearchResultItem[]> => {
  const tasks = await Task.find({
    tenantId,
    ...createTextFilter(query.q),
  })
    .select("title description status priority projectId createdAt updatedAt")
    .select({ score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" }, updatedAt: -1 })
    .skip(query.skip)
    .limit(query.limit)
    .lean();

  return tasks.map((task: any) => ({
    id: task._id.toString(),
    type: "tasks",
    title: task.title,
    description: task.description,
    status: task.status,
    metadata: {
      priority: task.priority,
      projectId: task.projectId?.toString(),
    },
    createdAt: toDate(task.createdAt),
    updatedAt: toDate(task.updatedAt),
  }));
};

const searchBugs = async (
  tenantId: string,
  query: SearchQuery,
): Promise<SearchResultItem[]> => {
  const bugs = await Bug.find({
    tenantId,
    ...createTextFilter(query.q),
  })
    .select("title description status severity projectId taskId createdAt updatedAt")
    .select({ score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" }, updatedAt: -1 })
    .skip(query.skip)
    .limit(query.limit)
    .lean();

  return bugs.map((bug: any) => ({
    id: bug._id.toString(),
    type: "bugs",
    title: bug.title,
    description: bug.description,
    status: bug.status,
    metadata: {
      severity: bug.severity,
      projectId: bug.projectId?.toString(),
      taskId: bug.taskId?.toString(),
    },
    createdAt: toDate(bug.createdAt),
    updatedAt: toDate(bug.updatedAt),
  }));
};

const searchDocuments = async (
  tenantId: string,
  query: SearchQuery,
): Promise<SearchResultItem[]> => {
  const documents = await ProjectDocument.find({
    tenantId,
    ...createTextFilter(query.q),
  })
    .select("name originalName description url category entityType entityId createdAt updatedAt")
    .select({ score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" }, updatedAt: -1 })
    .skip(query.skip)
    .limit(query.limit)
    .lean();

  return documents.map((document: any) => ({
    id: document._id.toString(),
    type: "documents",
    title: document.name || document.originalName,
    description: document.description,
    url: document.url,
    metadata: {
      originalName: document.originalName,
      category: document.category,
      entityType: document.entityType,
      entityId: document.entityId?.toString(),
    },
    createdAt: toDate(document.createdAt),
    updatedAt: toDate(document.updatedAt),
  }));
};

const searchComments = async (
  tenantId: string,
  query: SearchQuery,
): Promise<SearchResultItem[]> => {
  const comments = await Comment.find({
    tenantId,
    ...createTextFilter(query.q),
  })
    .select("content entityType entityId createdAt updatedAt")
    .select({ score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" }, updatedAt: -1 })
    .skip(query.skip)
    .limit(query.limit)
    .lean();

  return comments.map((comment: any) => ({
    id: comment._id.toString(),
    type: "comments",
    title: comment.content,
    metadata: {
      entityType: comment.entityType,
      entityId: comment.entityId?.toString(),
    },
    createdAt: toDate(comment.createdAt),
    updatedAt: toDate(comment.updatedAt),
  }));
};

const searchActivities = async (
  tenantId: string,
  query: SearchQuery,
): Promise<SearchResultItem[]> => {
  const activities = await Activity.find({
    tenantId,
    ...createTextFilter(query.q),
  })
    .select("action targetType targetId summary occurredAt createdAt updatedAt")
    .select({ score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" }, occurredAt: -1 })
    .skip(query.skip)
    .limit(query.limit)
    .lean();

  return activities.map((activity: any) => ({
    id: activity._id.toString(),
    type: "activities",
    title: activity.summary,
    description: activity.action,
    metadata: {
      targetType: activity.targetType,
      targetId: activity.targetId,
      occurredAt: activity.occurredAt,
    },
    createdAt: toDate(activity.createdAt),
    updatedAt: toDate(activity.updatedAt),
  }));
};

const searchNotifications = async (
  tenantId: string,
  userId: string,
  query: SearchQuery,
): Promise<SearchResultItem[]> => {
  const notifications = await Notification.find({
    tenantId,
    recipientId: userId,
    ...createTextFilter(query.q),
  })
    .select("type title message priority entityType entityId readAt createdAt updatedAt")
    .select({ score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" }, createdAt: -1 })
    .skip(query.skip)
    .limit(query.limit)
    .lean();

  return notifications.map((notification: any) => ({
    id: notification._id.toString(),
    type: "notifications",
    title: notification.title,
    description: notification.message,
    metadata: {
      notificationType: notification.type,
      priority: notification.priority,
      entityType: notification.entityType,
      entityId: notification.entityId,
      readAt: notification.readAt,
    },
    createdAt: toDate(notification.createdAt),
    updatedAt: toDate(notification.updatedAt),
  }));
};

const searchAnalytics = async (
  tenantId: string,
  query: SearchQuery,
): Promise<SearchResultItem[]> => {
  const events = await AnalyticsEvent.find({
    tenantId,
    ...createTextFilter(query.q),
  })
    .select("eventName entityType entityId occurredAt createdAt updatedAt")
    .select({ score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" }, occurredAt: -1 })
    .skip(query.skip)
    .limit(query.limit)
    .lean();

  return events.map((event: any) => ({
    id: event._id.toString(),
    type: "analytics",
    title: event.eventName,
    metadata: {
      entityType: event.entityType,
      entityId: event.entityId,
      occurredAt: event.occurredAt,
    },
    createdAt: toDate(event.createdAt),
    updatedAt: toDate(event.updatedAt),
  }));
};

const searchEmails = async (
  tenantId: string,
  query: SearchQuery,
): Promise<SearchResultItem[]> => {
  const emails = await EmailLog.find({
    tenantId,
    ...createTextFilter(query.q),
  })
    .select("subject to status templateKey sentAt createdAt updatedAt")
    .select({ score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" }, createdAt: -1 })
    .skip(query.skip)
    .limit(query.limit)
    .lean();

  return emails.map((email: any) => ({
    id: email._id.toString(),
    type: "emails",
    title: email.subject,
    status: email.status,
    metadata: {
      to: email.to,
      templateKey: email.templateKey,
      sentAt: email.sentAt,
    },
    createdAt: toDate(email.createdAt),
    updatedAt: toDate(email.updatedAt),
  }));
};

const searchOrders = async (
  tenantId: string,
  query: SearchQuery,
): Promise<SearchResultItem[]> => {
  const orders = await Order.find({
    tenantId,
    ...createTextFilter(query.q),
  })
    .select("productName orderNumber status paymentStatus amount createdAt updatedAt")
    .select({ score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" }, createdAt: -1 })
    .skip(query.skip)
    .limit(query.limit)
    .lean();

  return orders.map((order: any) => ({
    id: order._id.toString(),
    type: "orders",
    title: order.productName,
    status: order.status,
    metadata: {
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      amount: order.amount,
    },
    createdAt: toDate(order.createdAt),
    updatedAt: toDate(order.updatedAt),
  }));
};

const searchUsers = async (
  tenantId: string,
  query: SearchQuery,
): Promise<SearchResultItem[]> => {
  const users = await User.find({
    tenantId,
    ...createTextFilter(query.q),
  })
    .select("name email role createdAt updatedAt")
    .select({ score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" }, updatedAt: -1 })
    .skip(query.skip)
    .limit(query.limit)
    .lean();

  return users.map((user: any) => ({
    id: user._id.toString(),
    type: "users",
    title: user.name,
    description: user.email,
    metadata: {
      role: user.role,
    },
    createdAt: toDate(user.createdAt),
    updatedAt: toDate(user.updatedAt),
  }));
};

const searchRepository = async (
  tenantId: string,
  userId: string,
  query: SearchQuery,
  searchableTypes: SearchResourceType[],
): Promise<SearchResultsByType> => {
  const searchers: Record<SearchResourceType, () => Promise<SearchResultItem[]>> = {
    projects: () => searchProjects(tenantId, query),
    tasks: () => searchTasks(tenantId, query),
    bugs: () => searchBugs(tenantId, query),
    documents: () => searchDocuments(tenantId, query),
    comments: () => searchComments(tenantId, query),
    activities: () => searchActivities(tenantId, query),
    notifications: () => searchNotifications(tenantId, userId, query),
    analytics: () => searchAnalytics(tenantId, query),
    emails: () => searchEmails(tenantId, query),
    orders: () => searchOrders(tenantId, query),
    users: () => searchUsers(tenantId, query),
  };

  const entries = await Promise.all(
    searchableTypes.map(async (type) => {
      const results = await searchers[type]();
      return [type, results] as const;
    }),
  );

  return Object.fromEntries(entries) as SearchResultsByType;
};

export { searchRepository };
