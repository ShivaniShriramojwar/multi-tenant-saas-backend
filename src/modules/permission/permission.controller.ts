import { NextFunction, Response } from "express";
import { AuthRequest } from "../../common/interfaces/auth.interface";
import {
  getPermissionsService,
  updatePermissionsService,
} from "./permission.service";

const getPermissionsController = async (_req: AuthRequest, res: Response) => {
  return res.status(200).json({
    message: "Permissions fetched successfully",
    data: getPermissionsService(),
  });
};

const updatePermissionsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const permissions = updatePermissionsService(
      req.body.role,
      req.body.permissions,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Permissions updated successfully",
      data: permissions,
    });
  } catch (error) {
    next(error);
  }
};

export { getPermissionsController, updatePermissionsController };
