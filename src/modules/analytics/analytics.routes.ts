import { Router } from "express";

import {
  authorizePermission,
  verifyToken,
} from "../../common/middleware/auth.middleware";
import { writeLimiter } from "../../common/middleware/rate-limit.middleware";
import { validate } from "../../common/middleware/validate.middleware";

import {
  createAnalyticsEventController,
  getAnalyticsEventByIdController,
  getAnalyticsEventsController,
  getAnalyticsSummaryController,
  getAnalyticsTrendController,
  getTopAnalyticsEventsController,
} from "./analytics.controller";
import {
  analyticsAggregateQuerySchema,
  analyticsEventIdSchema,
  analyticsListQuerySchema,
  analyticsTrendQuerySchema,
  createAnalyticsEventSchema,
  topAnalyticsEventsQuerySchema,
} from "./analytics.validation";

const router = Router();

router.post(
  "/events",
  writeLimiter,
  verifyToken,
  authorizePermission("create_analytics"),
  validate({ body: createAnalyticsEventSchema }),
  createAnalyticsEventController,
);

router.get(
  "/events",
  verifyToken,
  authorizePermission("view_analytics"),
  validate({ query: analyticsListQuerySchema }),
  getAnalyticsEventsController,
);

router.get(
  "/summary",
  verifyToken,
  authorizePermission("view_analytics"),
  validate({ query: analyticsAggregateQuerySchema }),
  getAnalyticsSummaryController,
);

router.get(
  "/trend",
  verifyToken,
  authorizePermission("view_analytics"),
  validate({ query: analyticsTrendQuerySchema }),
  getAnalyticsTrendController,
);

router.get(
  "/top-events",
  verifyToken,
  authorizePermission("view_analytics"),
  validate({ query: topAnalyticsEventsQuerySchema }),
  getTopAnalyticsEventsController,
);

router.get(
  "/events/:id",
  verifyToken,
  authorizePermission("view_analytics"),
  validate({ params: analyticsEventIdSchema }),
  getAnalyticsEventByIdController,
);

export default router;
