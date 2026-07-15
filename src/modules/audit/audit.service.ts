import { AuditLog } from "./audit.model";
import { ClientSession } from "mongoose";
import { AuditAction } from "../../common/constants/audit-actions";
import { getPaginationMeta } from "../../common/utils/pagination.util";
import { AuditTarget } from "../../common/constants/audit-targets";

interface CreateAuditLogInput {
  tenantId: string;
  actorUserId: string;
  action: AuditAction;
  targetType: AuditTarget;
  targetId?: string;
  details?: Record<string, any>;
}

interface AuditLogListQuery {
  page: number;
  limit: number;
  skip: number;
  action?: string;
  targetType?: AuditTarget;
  search?: string;
}

const createAuditLog = async (data: CreateAuditLogInput) => {
  return AuditLog.create(data);
};

const createAuditLogWithSession = async (
  data: CreateAuditLogInput,
  session: ClientSession,
) => {
  const [auditLog] = await AuditLog.create([data], { session });

  return auditLog;
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
      .select("tenantId actorUserId action targetType targetId details createdAt updatedAt")
      .populate("actorUserId", "name email role")
      .sort({ createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return {
    data: logs,
    pagination: getPaginationMeta(query.page, query.limit, total),
  };
};

export { createAuditLog, createAuditLogWithSession, getAuditLogsService };
