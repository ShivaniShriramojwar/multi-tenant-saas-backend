import { NextFunction, Request, Response } from "express";
import { registerUserService } from "./register.service";

const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await registerUserService(req.body);

    return res.status(201).json({
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export { registerController };
