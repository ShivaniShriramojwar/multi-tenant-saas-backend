import { Router } from "express";

import {
  authorizePermission,
  verifyToken,
} from "../../common/middleware/auth.middleware";
import { writeLimiter } from "../../common/middleware/rate-limit.middleware";
import { validate } from "../../common/middleware/validate.middleware";

import {
  createActivityController,
  deleteActivityController,
  getActivitiesController,
  getActivityByIdController,
  getTargetActivitiesController,
} from "./activity.controller";
import {
  activityIdSchema,
  activityListQuerySchema,
  activityTargetParamsSchema,
  createActivitySchema,
} from "./activity.validation";

const router = Router();

router.post(
  "/",
  writeLimiter,
  verifyToken,
  authorizePermission("create_activity"),
  validate({ body: createActivitySchema }),
  createActivityController,
);

router.get(
  "/",
  verifyToken,
  authorizePermission("view_activity"),
  validate({ query: activityListQuerySchema }),
  getActivitiesController,
);

router.get(
  "/target/:targetType/:targetId",
  verifyToken,
  authorizePermission("view_activity"),
  validate({ params: activityTargetParamsSchema, query: activityListQuerySchema }),
  getTargetActivitiesController,
);

router.get(
  "/:id",
  verifyToken,
  authorizePermission("view_activity"),
  validate({ params: activityIdSchema }),
  getActivityByIdController,
);

router.delete(
  "/:id",
  writeLimiter,
  verifyToken,
  authorizePermission("delete_activity"),
  validate({ params: activityIdSchema }),
  deleteActivityController,
);

export default router;
