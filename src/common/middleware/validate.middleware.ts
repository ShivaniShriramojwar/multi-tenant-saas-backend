import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { isValidObjectId } from "../utils/object-id.util";

type RequestValidationSchemas = {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
};

const objectIdSchema = z
  .string()
  .trim()
  .refine(isValidObjectId, "Invalid ObjectId");

const optionalObjectIdSchema = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}, objectIdSchema.optional());

const idParamSchema = z.object({
  id: z
    .string()
    .trim()
    .refine(isValidObjectId, "Invalid id"),
});

const validate =
  (schemas: RequestValidationSchemas) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.query) {
        (req as any).query = {
          ...req.query,
          ...(schemas.query.parse(req.query) as object),
        };
      }

      if (schemas.params) {
        (req as any).params = {
          ...req.params,
          ...(schemas.params.parse(req.params) as object),
        };
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };

export { validate, objectIdSchema, optionalObjectIdSchema, idParamSchema };
