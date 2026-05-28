import { Router } from "express";
import {
  authorizePermission,
  verifyToken,
} from "../../common/middleware/auth.middleware";
import { writeLimiter } from "../../common/middleware/rate-limit.middleware";
import { imageUpload } from "../../common/middleware/upload.middleware";
import {
  createUserController,
  deleteUserController,
  getUserProfileController,
  getUsersController,
  updateUserRoleController,
  uploadProfileImageController,
} from "./user.controller";

const router = Router();

router.get("/profile", verifyToken, getUserProfileController);
router.post(
  "/profile/image",
  writeLimiter,
  verifyToken,
  imageUpload.single("image"),
  uploadProfileImageController,
);

router.get("/", verifyToken, authorizePermission("view_users"), getUsersController);
router.post("/", writeLimiter, verifyToken, authorizePermission("create_user"), createUserController);
router.delete("/:id", writeLimiter, verifyToken, authorizePermission("delete_user"), deleteUserController);
router.patch("/:id/role", writeLimiter, verifyToken, authorizePermission("manage_roles"), updateUserRoleController);

export default router;
