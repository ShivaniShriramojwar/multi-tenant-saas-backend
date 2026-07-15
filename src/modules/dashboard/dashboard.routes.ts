import { Router } from "express";

import {
  authorizePermission,
  verifyToken,
} from "../../common/middleware/auth.middleware";

import { getDashboardCountsController } from "./dashboard.controller";

const router = Router();

/**
 * GET /api/v1/dashboard
 */
router.get(
  "/",
  verifyToken,
  authorizePermission("view_dashboard"),
  getDashboardCountsController,
);

export default router;
