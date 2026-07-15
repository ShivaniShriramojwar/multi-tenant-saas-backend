import { Router } from "express";

import {
  verifyToken,
  authorizePermission,
} from "../../common/middleware/auth.middleware";
import { validate } from "../../common/middleware/validate.middleware";

import {
  createTaskController,
  getTasksController,
  getTaskByIdController,
  updateTaskController,
  deleteTaskController,
  assignTaskController,
  updateTaskStatusController,
} from "./task.controller";
import {
  assignTaskSchema,
  createTaskSchema,
  getTasksQuerySchema,
  taskIdSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "./task.validation";

const router = Router();

// Create Task
router.post(
  "/",
  verifyToken,
  authorizePermission("create_task"),
  validate({ body: createTaskSchema }),
  createTaskController,
);

// Get All Tasks
router.get(
  "/",
  verifyToken,
  authorizePermission("view_task"),
  validate({ query: getTasksQuerySchema }),
  getTasksController,
);

// Get Task By Id
router.get(
  "/:id",
  verifyToken,
  authorizePermission("view_task"),
  validate({ params: taskIdSchema }),
  getTaskByIdController,
);

// Update Task
router.put(
  "/:id",
  verifyToken,
  authorizePermission("update_task"),
  validate({ params: taskIdSchema, body: updateTaskSchema }),
  updateTaskController,
);

// Delete Task
router.delete(
  "/:id",
  verifyToken,
  authorizePermission("delete_task"),
  validate({ params: taskIdSchema }),
  deleteTaskController,
);

// Assign task to user
router.patch(
  "/:id/assign",
  verifyToken,
  authorizePermission("assign_task"),
  validate({ params: taskIdSchema, body: assignTaskSchema }),
  assignTaskController,
);

// Update task status
router.patch(
  "/:id/status",
  verifyToken,
  authorizePermission("update_task"),
  validate({ params: taskIdSchema, body: updateTaskStatusSchema }),
  updateTaskStatusController,
);
export default router;
