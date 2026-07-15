import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../common/interfaces/auth.interface";
import {
  getSessionsService,
  logoutService,
  refreshAccessTokenService,
  revokeSessionService,
} from "./session.service";

const refreshTokenController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tokens = await refreshAccessTokenService(req.body.refreshToken);

    return res.status(200).json({
      message: "Token refreshed successfully",
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

const logoutController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await logoutService(req.body.refreshToken);

    return res.status(200).json({
      message: "Logout successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSessionsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessions = await getSessionsService(
      req.user!.userId,
      req.user!.tenantId,
    );

    return res.status(200).json({
      message: "Sessions fetched successfully",
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

const revokeSessionController = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
  } catch (error) {
    next(error);
  }
};

export {
  refreshTokenController,
  logoutController,
  getSessionsController,
  revokeSessionController,
};
