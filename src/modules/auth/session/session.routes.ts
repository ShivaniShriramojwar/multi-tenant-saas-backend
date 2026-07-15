import { Router } from "express";
import { verifyToken } from "../../../common/middleware/auth.middleware";
import { validate } from "../../../common/middleware/validate.middleware";
import {
  getSessionsController,
  logoutController,
  refreshTokenController,
  revokeSessionController,
} from "./session.controller";
import { refreshTokenSchema, sessionIdSchema } from "./session.validation";

const router = Router();

router.post(
  "/refresh",
  validate({ body: refreshTokenSchema }),
  refreshTokenController,
);

router.post(
  "/logout",
  validate({ body: refreshTokenSchema }),
  logoutController,
);

router.get("/sessions", verifyToken, getSessionsController);

router.delete(
  "/sessions/:id",
  verifyToken,
  validate({ params: sessionIdSchema }),
  revokeSessionController,
);

export default router;
