import { AuditAction, AuditLog } from "./audit.model";
import { getPaginationMeta } from "../../common/utils/pagination.util";

interface CreateAuditLogInput {
  tenantId: string;
  actorUserId: string;
  action: AuditAction;
  targetType: "user" | "order" | "permission";
  targetId?: string;
  details?: Record<string, any>;
}

interface AuditLogListQuery {
  page: number;
  limit: number;
  skip: number;
  action?: string;
  targetType?: string;
  search?: string;
}

const createAuditLog = async (data: CreateAuditLogInput) => {
  return AuditLog.create(data);
};

const getAuditLogsService = async (
  tenantId: string,
  query: AuditLogListQuery,
) => {
  const filter: any = { tenantId };

  if (query.action) {
    filter.action = query.action;
  }

  if (query.targetType) {
    filter.targetType = query.targetType;
  }

  if (query.search) {
    filter.$or = [
      { action: { $regex: query.search, $options: "i" } },
      { targetType: { $regex: query.search, $options: "i" } },
      { targetId: { $regex: query.search, $options: "i" } },
    ];
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .select("-__v")
      .populate("actorUserId", "name email role")
      .sort({ createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit),
    AuditLog.countDocuments(filter),
  ]);

  return {
    data: logs,
    pagination: getPaginationMeta(query.page, query.limit, total),
  };
};

export { createAuditLog, getAuditLogsService };
