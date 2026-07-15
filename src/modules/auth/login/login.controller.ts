import { NextFunction, Request, Response } from "express";
import { loginUserService } from "./login.service";

const loginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await loginUserService(req.body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    return res.status(200).json({
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export { loginController };
