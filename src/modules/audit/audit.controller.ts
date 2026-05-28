import { Response } from "express";
import { AuthRequest } from "../../common/interfaces/auth.interface";
import { getPagination } from "../../common/utils/pagination.util";
import { getAuditLogsService } from "./audit.service";

const getAuditLogsController = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await getAuditLogsService(req.user!.tenantId, {
      ...getPagination(req.query),
      action: req.query.action?.toString(),
      targetType: req.query.targetType?.toString(),
      search: req.query.search?.toString(),
    });

    return res.status(200).json({
      message: "Audit logs fetched successfully",
      data: logs.data,
      pagination: logs.pagination,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export { getAuditLogsController };
