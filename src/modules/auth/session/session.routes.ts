import { Router } from "express";
import { verifyToken } from "../../../common/middleware/auth.middleware";
import {
  getSessionsController,
  logoutController,
  refreshTokenController,
  revokeSessionController,
} from "./session.controller";

const router = Router();

router.post("/refresh", refreshTokenController);
router.post("/logout", logoutController);
router.get("/sessions", verifyToken, getSessionsController);
router.delete("/sessions/:id", verifyToken, revokeSessionController);

export default router;
