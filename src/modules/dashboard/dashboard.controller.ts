import { NextFunction, Response } from "express";
import { AuthRequest } from "../../common/interfaces/auth.interface";
import { getDashboardCountsService } from "./dashboard.service";

const getDashboardCountsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;

    const dashboard = await getDashboardCountsService(tenantId);

    return res.status(200).json({
      message: "Dashboard fetched successfully",
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

export { getDashboardCountsController };
