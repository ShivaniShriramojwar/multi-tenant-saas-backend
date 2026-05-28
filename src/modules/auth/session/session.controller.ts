import { Response } from "express";
import { AuthRequest } from "../../../common/interfaces/auth.interface";
import {
  getSessionsService,
  logoutService,
  refreshAccessTokenService,
  revokeSessionService,
} from "./session.service";
import { refreshTokenSchema } from "./session.validation";

const refreshTokenController = async (req: AuthRequest, res: Response) => {
  try {
    const validatedBody = refreshTokenSchema.parse(req.body);
    const tokens = await refreshAccessTokenService(validatedBody.refreshToken);

    return res.status(200).json({
      message: "Token refreshed successfully",
      data: tokens,
    });
  } catch (error: any) {
    return res.status(401).json({
      message: error.issues?.[0]?.message || error.message,
    });
  }
};

const logoutController = async (req: AuthRequest, res: Response) => {
  try {
    const validatedBody = refreshTokenSchema.parse(req.body);
    const result = await logoutService(validatedBody.refreshToken);

    return res.status(200).json({
      message: "Logout successful",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.issues?.[0]?.message || error.message,
    });
  }
};

const getSessionsController = async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await getSessionsService(
      req.user!.userId,
      req.user!.tenantId,
    );

    return res.status(200).json({
      message: "Sessions fetched successfully",
      data: sessions,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

const revokeSessionController = async (req: AuthRequest, res: Response) => {
  try {
    const result = await revokeSessionService(
      req.params.id,
      req.user!.userId,
      req.user!.tenantId,
    );

    return res.status(200).json({
      message: "Session revoked successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

export {
  refreshTokenController,
  logoutController,
  getSessionsController,
  revokeSessionController,
};
