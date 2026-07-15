import { NextFunction, Response } from "express";

import { AuthRequest } from "../../common/interfaces/auth.interface";
import { getReportService } from "./report.service";
import { ReportExport } from "./report.types";

const isReportExport = (value: unknown): value is ReportExport => {
  return Boolean(
    value &&
      typeof value === "object" &&
      "buffer" in value &&
      "filename" in value &&
      "contentType" in value,
  );
};

const getReportController = (reportType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await getReportService(reportType, req.user!.tenantId, req.query as any);

      if (isReportExport(result.data)) {
        res.setHeader("Content-Type", result.data.contentType);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${result.data.filename}"`,
        );

        return res.status(200).send(result.data.buffer);
      }

      return res.status(200).json({
        message: "Report generated successfully",
        data: result,
      });
    } catch (error) {
    next(error);
  }
  };
};

export { getReportController };
