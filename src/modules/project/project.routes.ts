import { Router } from "express";
import { logger } from "../../common/logger";

import {
  createProjectController,
  getProjectsController,
  getProjectByIdController,
  updateProjectController,
  deleteProjectController,
} from "./project.controller";

import {
  authorizePermission,
  verifyToken,
} from "../../common/middleware/auth.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import {
  createProjectSchema,
  getProjectsQuerySchema,
  projectIdSchema,
  updateProjectSchema,
} from "./project.validation";

const router = Router();
logger.info("Project routes loaded");
router.post(
  "/",
  verifyToken,
  authorizePermission("create_project"),
  validate({ body: createProjectSchema }),
  createProjectController,
);

router.get(
  "/",
  verifyToken,
  authorizePermission("view_project"),
  validate({ query: getProjectsQuerySchema }),
  getProjectsController,
);

router.get(
  "/:id",
  verifyToken,
  authorizePermission("view_project"),
  validate({ params: projectIdSchema }),
  getProjectByIdController,
);

router.put(
  "/:id",
  verifyToken,
  authorizePermission("update_project"),
  validate({ params: projectIdSchema, body: updateProjectSchema }),
  updateProjectController,
);

router.delete(
  "/:id",
  verifyToken,
  authorizePermission("delete_project"),
  validate({ params: projectIdSchema }),
  deleteProjectController,
);

export default router;
