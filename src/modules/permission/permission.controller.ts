import { Response } from "express";
import { AuthRequest } from "../../common/interfaces/auth.interface";
import {
  getPermissionsService,
  updatePermissionsService,
} from "./permission.service";
import { updatePermissionsSchema } from "./permission.validation";

const getPermissionsController = async (_req: AuthRequest, res: Response) => {
  return res.status(200).json({
    message: "Permissions fetched successfully",
    data: getPermissionsService(),
  });
};

const updatePermissionsController = async (req: AuthRequest, res: Response) => {
  try {
    const validatedBody = updatePermissionsSchema.parse(req.body);

    const permissions = await updatePermissionsService(
      validatedBody,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Permissions updated successfully",
      data: permissions,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.issues?.[0]?.message || error.message,
    });
  }
};

export { getPermissionsController, updatePermissionsController };
