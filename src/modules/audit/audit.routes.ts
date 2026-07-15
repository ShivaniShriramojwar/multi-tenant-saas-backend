import { Router } from "express";
import {
  authorizePermission,
  verifyToken,
} from "../../common/middleware/auth.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { getAuditLogsController } from "./audit.controller";
import { auditLogsQuerySchema } from "./audit.validation";

const router = Router();

router.get(
  "/",
  verifyToken,
  authorizePermission("view_audit_logs"),
  validate({ query: auditLogsQuerySchema }),
  getAuditLogsController,
);

export default router;
