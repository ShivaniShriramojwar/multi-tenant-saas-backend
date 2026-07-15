import { NextFunction, Response } from "express";
import { AuthRequest } from "../../common/interfaces/auth.interface";
import { getPagination } from "../../common/utils/pagination.util";
import { AUDIT_TARGETS, AuditTarget } from "../../common/constants/audit-targets";
import { getAuditLogsService } from "./audit.service";

const getAuditLogsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const targetType = req.query.targetType?.toString();

    const logs = await getAuditLogsService(req.user!.tenantId, {
      ...getPagination(req.query),
      action: req.query.action?.toString(),
      targetType: AUDIT_TARGETS.includes(targetType as AuditTarget)
        ? (targetType as AuditTarget)
        : undefined,
      search: req.query.search?.toString(),
    });

    return res.status(200).json({
      message: "Audit logs fetched successfully",
      data: logs.data,
      pagination: logs.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export { getAuditLogsController };
