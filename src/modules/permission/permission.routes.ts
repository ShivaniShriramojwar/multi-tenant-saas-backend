import { Router } from "express";
import {
  authorizePermission,
  verifyToken,
} from "../../common/middleware/auth.middleware";
import { writeLimiter } from "../../common/middleware/rate-limit.middleware";
import {
  getPermissionsController,
  updatePermissionsController,
} from "./permission.controller";

const router = Router();

router.get("/", verifyToken, authorizePermission("manage_roles"), getPermissionsController);
router.patch("/", writeLimiter, verifyToken, authorizePermission("manage_roles"), updatePermissionsController);

export default router;
