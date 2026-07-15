import { Router } from "express";
import {
  authorizePermission,
  verifyToken,
} from "../../common/middleware/auth.middleware";
import { writeLimiter } from "../../common/middleware/rate-limit.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import {
  getPermissionsController,
  updatePermissionsController,
} from "./permission.controller";
import { updatePermissionsSchema } from "./permission.validation";

const router = Router();

router.get(
  "/",
  verifyToken,
  authorizePermission("manage_roles"),
  getPermissionsController,
);

router.patch(
  "/",
  writeLimiter,
  verifyToken,
  authorizePermission("manage_roles"),
  validate({ body: updatePermissionsSchema }),
  updatePermissionsController,
);

export default router;
