import mongoose from "mongoose";

import { AuditLog } from "../audit/audit.model";
import { Bug } from "../bug/bug.model";
import { Order } from "../order/order.model";
import { Project } from "../project/project.model";
import { Task } from "../task/task.model";
import { User } from "../user/user.model";
import { ReportQuery } from "./report.types";

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

const buildDateFilter = (query: ReportQuery, field = "createdAt") => {
  if (!query.fromDate && !query.toDate) {
    return {};
  }

  const range: Record<string, Date> = {};

  if (query.fromDate) {
    range.$gte = query.fromDate;
  }

  if (query.toDate) {
    range.$lte = query.toDate;
  }

  return { [field]: range };
};

const groupByField = async (
  model: mongoose.Model<any>,
  tenantId: string,
  field: string,
  query: ReportQuery,
) => {
  return model.aggregate([
    {
      $match: {
        tenantId: toObjectId(tenantId),
        ...buildDateFilter(query),
      },
    },
    {
      $group: {
        _id: `$${field}`,
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

const getProjectReport = async (tenantId: string, query: ReportQuery) => {
  const [totalProjects, byStatus, recentlyUpdated] = await Promise.all([
    Project.countDocuments({ tenantId, ...buildDateFilter(query) }),
    groupByField(Project, tenantId, "status", query),
    Project.find({ tenantId, ...buildDateFilter(query) })
      .select("name status startDate endDate updatedAt")
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean(),
  ]);

  return { totalProjects, byStatus, recentlyUpdated };
};

const getTaskReport = async (tenantId: string, query: ReportQuery) => {
  const [totalTasks, byStatus, byPriority, completion] = await Promise.all([
    Task.countDocuments({ tenantId, ...buildDateFilter(query) }),
    groupByField(Task, tenantId, "status", query),
    groupByField(Task, tenantId, "priority", query),
    Task.aggregate([
      {
        $match: {
          tenantId: toObjectId(tenantId),
          ...buildDateFilter(query),
        },
      },
      {
        $group: {
          _id: null,
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] },
          },
          total: { $sum: 1 },
        },
      },
    ]),
  ]);

  const stats = completion[0] || { completed: 0, total: 0 };

  return {
    totalTasks,
    byStatus,
    byPriority,
    completionRate:
      stats.total > 0 ? Number(((stats.completed / stats.total) * 100).toFixed(2)) : 0,
  };
};

const getBugReport = async (tenantId: string, query: ReportQuery) => {
  const [totalBugs, byStatus, bySeverity] = await Promise.all([
    Bug.countDocuments({ tenantId, ...buildDateFilter(query) }),
    groupByField(Bug, tenantId, "status", query),
    groupByField(Bug, tenantId, "severity", query),
  ]);

  return { totalBugs, byStatus, bySeverity };
};

const getTeamWorkloadReport = async (tenantId: string, query: ReportQuery) => {
  const [taskWorkload, bugWorkload] = await Promise.all([
    Task.aggregate([
      {
        $match: {
          tenantId: toObjectId(tenantId),
          assignedTo: { $ne: null },
          ...buildDateFilter(query),
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          totalTasks: { $sum: 1 },
          openTasks: {
            $sum: { $cond: [{ $ne: ["$status", "DONE"] }, 1, 0] },
          },
          completedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] },
          },
        },
      },
    ]),
    Bug.aggregate([
      {
        $match: {
          tenantId: toObjectId(tenantId),
          assignedTo: { $ne: null },
          ...buildDateFilter(query),
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          totalBugs: { $sum: 1 },
          openBugs: {
            $sum: { $cond: [{ $ne: ["$status", "CLOSED"] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const userIds = Array.from(
    new Set(
      [...taskWorkload, ...bugWorkload]
        .map((item) => item._id?.toString())
        .filter(Boolean),
    ),
  );

  const users = await User.find({
    _id: { $in: userIds },
    tenantId,
  })
    .select("name email role")
    .lean();

  return userIds.map((userId) => {
    const user = users.find((item: any) => item._id.toString() === userId);
    const tasks = taskWorkload.find((item) => item._id.toString() === userId);
    const bugs = bugWorkload.find((item) => item._id.toString() === userId);

    return {
      userId,
      name: user?.name,
      email: user?.email,
      role: user?.role,
      totalTasks: tasks?.totalTasks || 0,
      openTasks: tasks?.openTasks || 0,
      completedTasks: tasks?.completedTasks || 0,
      totalBugs: bugs?.totalBugs || 0,
      openBugs: bugs?.openBugs || 0,
    };
  });
};

const getOrderReport = async (tenantId: string, query: ReportQuery) => {
  const [summary, byStatus, byPaymentStatus] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          tenantId: toObjectId(tenantId),
          ...buildDateFilter(query),
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$amount" },
          averageOrderValue: { $avg: "$amount" },
        },
      },
    ]),
    groupByField(Order, tenantId, "status", query),
    groupByField(Order, tenantId, "paymentStatus", query),
  ]);

  return {
    ...(summary[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
    }),
    byStatus,
    byPaymentStatus,
  };
};

const getAuditReport = async (tenantId: string, query: ReportQuery) => {
  const [totalAuditLogs, byAction, byTargetType, recentLogs] = await Promise.all([
    AuditLog.countDocuments({ tenantId, ...buildDateFilter(query) }),
    groupByField(AuditLog, tenantId, "action", query),
    groupByField(AuditLog, tenantId, "targetType", query),
    AuditLog.find({ tenantId, ...buildDateFilter(query) })
      .select("actorUserId action targetType targetId createdAt")
      .populate("actorUserId", "name email role")
      .sort({ createdAt: -1 })
      .limit(25)
      .lean(),
  ]);

  return { totalAuditLogs, byAction, byTargetType, recentLogs };
};

export {
  getProjectReport,
  getTaskReport,
  getBugReport,
  getTeamWorkloadReport,
  getOrderReport,
  getAuditReport,
};
