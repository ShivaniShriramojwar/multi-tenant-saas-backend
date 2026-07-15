import { z } from "zod";
import { idParamSchema } from "../../common/middleware/validate.middleware";

const optionalDateSchema = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date;
}, z.date("Invalid date").optional());

const createAnalyticsEventSchema = z.object({
  userId: z.string().trim().min(1).optional(),
  eventName: z.string().trim().min(1, "Event name is required").max(120),
  entityType: z.string().trim().min(1).max(80).optional(),
  entityId: z.string().trim().min(1).max(120).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
  occurredAt: optionalDateSchema,
});

const analyticsListQuerySchema = z.object({
  userId: z.string().trim().min(1).optional(),
  eventName: z.string().trim().min(1).optional(),
  entityType: z.string().trim().min(1).optional(),
  entityId: z.string().trim().min(1).optional(),
  fromDate: optionalDateSchema,
  toDate: optionalDateSchema,
  search: z.string().trim().min(1).optional(),
});

const analyticsAggregateQuerySchema = z.object({
  userId: z.string().trim().min(1).optional(),
  eventName: z.string().trim().min(1).optional(),
  entityType: z.string().trim().min(1).optional(),
  entityId: z.string().trim().min(1).optional(),
  fromDate: optionalDateSchema,
  toDate: optionalDateSchema,
});

const analyticsTrendQuerySchema = analyticsAggregateQuerySchema.extend({
  interval: z.enum(["hour", "day", "month"]).default("day"),
});
const topAnalyticsEventsQuerySchema = analyticsAggregateQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
const analyticsEventIdSchema = idParamSchema;

export {
  createAnalyticsEventSchema,
  analyticsListQuerySchema,
  analyticsAggregateQuerySchema,
  analyticsTrendQuerySchema,
  topAnalyticsEventsQuerySchema,
  analyticsEventIdSchema,
};
