import { z } from "zod";

import { BUG_STATUS, BUG_STATUSES } from "../../common/constants/bug-status";

import { SEVERITY, SEVERITIES } from "../../common/constants/severity";
import {
  idParamSchema,
  objectIdSchema,
  optionalObjectIdSchema,
} from "../../common/middleware/validate.middleware";

const createBugSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),

  description: z.string().trim().min(5, "Description is required"),

  projectId: objectIdSchema,

  taskId: optionalObjectIdSchema,

  assignedTo: optionalObjectIdSchema,

  severity: z.enum(SEVERITIES).default(SEVERITY.MEDIUM),

  status: z.enum(BUG_STATUSES).default(BUG_STATUS.OPEN),
});

const updateBugSchema = createBugSchema.partial();

const assignBugSchema = z.object({
  assignedTo: objectIdSchema,
});

const updateBugStatusSchema = z.object({
  status: z.enum(BUG_STATUSES),
});

const updateBugSeveritySchema = z.object({
  severity: z.enum(SEVERITIES),
});
const getBugsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: z.enum(BUG_STATUSES).optional(),
  severity: z.enum(SEVERITIES).optional(),
  projectId: optionalObjectIdSchema,
  taskId: optionalObjectIdSchema,
  assignedTo: optionalObjectIdSchema,
  reportedBy: optionalObjectIdSchema,
});
const bugIdSchema = idParamSchema;

export {
  createBugSchema,
  getBugsQuerySchema,
  bugIdSchema,
  updateBugSchema,
  assignBugSchema,
  updateBugStatusSchema,
  updateBugSeveritySchema,
};
