import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error";
import { logger } from "../logger";

const getMulterStatusCode = (err: multer.MulterError) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return 413;
  }

  return 400;
};

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error(
    {
      err,
      requestId: req.id,
      route: req.originalUrl,
      statusCode: err.statusCode || 500,
    },
    "Request error",
  );

  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: err.issues?.[0]?.message || "Validation failed",
    });
  }

  const statusCode = err instanceof multer.MulterError
    ? getMulterStatusCode(err)
    : err instanceof AppError
      ? err.statusCode
      : err.statusCode || 500;

  return res.status(statusCode).json({
    message: err.message || "Internal Server Error",
  });
};

export { errorHandler };
