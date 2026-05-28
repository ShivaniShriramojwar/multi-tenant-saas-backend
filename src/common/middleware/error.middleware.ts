import { Request, Response, NextFunction } from "express";

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("🔥 Error:", err.message);

  return res.status(err.statusCode || 500).json({
    message: err.message || "Internal Server Error",
  });
};

export { errorHandler };
