import { Router } from "express";
import {
  authorizePermission,
  verifyToken,
} from "../../common/middleware/auth.middleware";
import { writeLimiter } from "../../common/middleware/rate-limit.middleware";
import { imageUpload } from "../../common/middleware/upload.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import {
  createUserController,
  deleteUserController,
  getUserProfileController,
  getUsersController,
  updateUserRoleController,
  uploadProfileImageController,
} from "./user.controller";
import {
  createUserSchema,
  getUsersQuerySchema,
  updateUserRoleSchema,
  userIdSchema,
} from "./user.validation";

const router = Router();

router.get("/profile", verifyToken, getUserProfileController);
router.post(
  "/profile/image",
  writeLimiter,
  verifyToken,
  imageUpload.single("image"),
  uploadProfileImageController,
);

router.get(
  "/",
  verifyToken,
  authorizePermission("manage_users"),
  validate({ query: getUsersQuerySchema }),
  getUsersController,
);

router.post(
  "/",
  writeLimiter,
  verifyToken,
  authorizePermission("manage_users"),
  validate({ body: createUserSchema }),
  createUserController,
);

router.delete(
  "/:id",
  writeLimiter,
  verifyToken,
  authorizePermission("manage_users"),
  validate({ params: userIdSchema }),
  deleteUserController,
);

router.patch(
  "/:id/role",
  writeLimiter,
  verifyToken,
  authorizePermission("manage_roles"),
  validate({ params: userIdSchema, body: updateUserRoleSchema }),
  updateUserRoleController,
);

export default router;
