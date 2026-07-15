import { z } from "zod";
import { idParamSchema } from "../../common/middleware/validate.middleware";

import { ACTIVITY_VISIBILITIES } from "./activity.model";

const optionalDateSchema = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date;
}, z.date("Invalid date").optional());

const activityChangeSchema = z.object({
  field: z.string().trim().min(1, "Change field is required"),
  from: z.unknown().optional(),
  to: z.unknown().optional(),
});

const createActivitySchema = z.object({
  actorUserId: z.string().trim().min(1).optional(),
  action: z.string().trim().min(1, "Action is required"),
  targetType: z.string().trim().min(1, "Target type is required"),
  targetId: z.string().trim().min(1, "Target ID is required"),
  projectId: z.string().trim().min(1).optional(),
  summary: z.string().trim().min(1, "Summary is required").max(1000),
  changes: z.array(activityChangeSchema).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  visibility: z.enum(ACTIVITY_VISIBILITIES).optional(),
  occurredAt: optionalDateSchema,
});

const activityListQuerySchema = z.object({
  actorUserId: z.string().trim().min(1).optional(),
  action: z.string().trim().min(1).optional(),
  targetType: z.string().trim().min(1).optional(),
  targetId: z.string().trim().min(1).optional(),
  entityType: z.string().trim().min(1).optional(),
  entityId: z.string().trim().min(1).optional(),
  projectId: z.string().trim().min(1).optional(),
  visibility: z.enum(ACTIVITY_VISIBILITIES).optional(),
  fromDate: optionalDateSchema,
  toDate: optionalDateSchema,
  search: z.string().trim().min(1).optional(),
});

const activityTargetParamsSchema = z.object({
  targetType: z.string().trim().min(1, "Target type is required"),
  targetId: z.string().trim().min(1, "Target ID is required"),
});
const activityIdSchema = idParamSchema;

export {
  createActivitySchema,
  activityListQuerySchema,
  activityTargetParamsSchema,
  activityIdSchema,
};
