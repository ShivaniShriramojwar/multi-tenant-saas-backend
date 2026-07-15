import { Router } from "express";

import {
  verifyToken,
  authorizePermission,
} from "../../common/middleware/auth.middleware";
import { validate } from "../../common/middleware/validate.middleware";

import {
  createBugController,
  getBugsController,
  getBugByIdController,
  updateBugController,
  deleteBugController,
  assignBugController,
  updateBugStatusController,
  updateBugSeverityController,
} from "./bug.controller";
import {
  assignBugSchema,
  bugIdSchema,
  createBugSchema,
  getBugsQuerySchema,
  updateBugSchema,
  updateBugSeveritySchema,
  updateBugStatusSchema,
} from "./bug.validation";

const router = Router();

router.post(
  "/",
  verifyToken,
  authorizePermission("create_bug"),
  validate({ body: createBugSchema }),
  createBugController,
);

router.get(
  "/",
  verifyToken,
  authorizePermission("view_bug"),
  validate({ query: getBugsQuerySchema }),
  getBugsController,
);

router.get(
  "/:id",
  verifyToken,
  authorizePermission("view_bug"),
  validate({ params: bugIdSchema }),
  getBugByIdController,
);

router.put(
  "/:id",
  verifyToken,
  authorizePermission("update_bug"),
  validate({ params: bugIdSchema, body: updateBugSchema }),
  updateBugController,
);

router.patch(
  "/:id/assign",
  verifyToken,
  authorizePermission("update_bug"),
  validate({ params: bugIdSchema, body: assignBugSchema }),
  assignBugController,
);

router.patch(
  "/:id/status",
  verifyToken,
  authorizePermission("update_bug"),
  validate({ params: bugIdSchema, body: updateBugStatusSchema }),
  updateBugStatusController,
);

router.patch(
  "/:id/severity",
  verifyToken,
  authorizePermission("update_bug"),
  validate({ params: bugIdSchema, body: updateBugSeveritySchema }),
  updateBugSeverityController,
);

router.delete(
  "/:id",
  verifyToken,
  authorizePermission("delete_bug"),
  validate({ params: bugIdSchema }),
  deleteBugController,
);

export default router;
