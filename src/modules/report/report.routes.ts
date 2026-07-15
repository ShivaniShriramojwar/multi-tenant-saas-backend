import { Router } from "express";

import {
  authorizePermission,
  verifyToken,
} from "../../common/middleware/auth.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { getReportController } from "./report.controller";
import { reportQuerySchema } from "./report.validation";

const router = Router();

router.get(
  "/projects",
  verifyToken,
  authorizePermission("view_reports"),
  validate({ query: reportQuerySchema }),
  getReportController("projects"),
);

router.get(
  "/tasks",
  verifyToken,
  authorizePermission("view_reports"),
  validate({ query: reportQuerySchema }),
  getReportController("tasks"),
);

router.get(
  "/bugs",
  verifyToken,
  authorizePermission("view_reports"),
  validate({ query: reportQuerySchema }),
  getReportController("bugs"),
);

router.get(
  "/team-workload",
  verifyToken,
  authorizePermission("view_reports"),
  validate({ query: reportQuerySchema }),
  getReportController("team-workload"),
);

router.get(
  "/orders",
  verifyToken,
  authorizePermission("view_reports"),
  validate({ query: reportQuerySchema }),
  getReportController("orders"),
);

router.get(
  "/audit",
  verifyToken,
  authorizePermission("view_reports"),
  validate({ query: reportQuerySchema }),
  getReportController("audit"),
);

export default router;
