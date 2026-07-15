import { NextFunction, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../interfaces/auth.interface";

const getObjectIdString = (value: any) => {
  return value?._id?.toString() ?? value?.toString();
};

const isValidObjectId = (value: string) => {
  return mongoose.Types.ObjectId.isValid(value);
};

const validateObjectIdParam =
  (paramName = "id") =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    const value = req.params[paramName];

    if (!value || !isValidObjectId(value)) {
      return res.status(400).json({
        message: `Invalid ${paramName}`,
      });
    }

    return next();
  };

export { getObjectIdString, isValidObjectId, validateObjectIdParam };
