import { z } from "zod";

import { ENTITY_TYPE, ENTITY_TYPES } from "../../common/constants/entity-type";
import {
  idParamSchema,
  objectIdSchema,
  optionalObjectIdSchema,
} from "../../common/middleware/validate.middleware";

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment is required")
    .max(5000, "Comment is too long"),

  entityType: z.enum(ENTITY_TYPES).default(ENTITY_TYPE.TASK),

  entityId: objectIdSchema,

  parentComment: optionalObjectIdSchema,

  mentions: z.array(z.string()).optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1).max(5000).optional(),

  mentions: z.array(z.string()).optional(),
});

export const getCommentsQuerySchema = z.object({
  entityType: z.enum(ENTITY_TYPES).optional(),
  entityId: optionalObjectIdSchema,
  createdBy: optionalObjectIdSchema,
  search: z.string().trim().min(1).optional(),
});

export const commentIdSchema = idParamSchema;
