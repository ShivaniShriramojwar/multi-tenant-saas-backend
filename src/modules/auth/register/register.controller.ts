import { Request, Response } from "express";
import { registerUserService } from "./register.service";
import { registerSchema } from "./register.validation";

const registerController = async (req: Request, res: Response) => {
  try {
    const validatedBody = registerSchema.parse(req.body);
    const result = await registerUserService(validatedBody);

    return res.status(201).json({
      message: "User registered successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.issues?.[0]?.message || error.message,
    });
  }
};

export { registerController };
