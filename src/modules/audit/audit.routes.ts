import { Router } from "express";
import {
  authorizePermission,
  verifyToken,
} from "../../common/middleware/auth.middleware";
import { getAuditLogsController } from "./audit.controller";

const router = Router();

router.get("/", verifyToken, authorizePermission("view_audit_logs"), getAuditLogsController);

export default router;
