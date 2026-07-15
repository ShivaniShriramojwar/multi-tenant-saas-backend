import { logger } from "../../common/logger";
import { ConflictError, NotFoundError } from "../../common/errors/app-error";
import { AUDIT_ACTION } from "../../common/constants/audit-actions";
import { emitTenantNotification } from "../../infrastructure/socket/socket";
import { createAuditLog } from "../audit/audit.service";

import { getProjectByIdAndTenant } from "../project/project.repository";

import {
  createTask,
  getTaskById,
  getTasksByTenant,
  updateTaskById,
  deleteTaskById,
  assignTaskToUser,
  updateTaskStatus,
} from "./task.repository";

import { TaskStatus } from "../../common/constants/task-status";
import { CreateTaskInput, TaskListQuery, UpdateTaskInput } from "./task.types";
import {
  assertSameTenant,
  buildPaginationResponse,
  createNotFoundError,
} from "../../common/utils/service.util";
import { validateUserBelongsToTenant } from "../user/user-tenant.util";

const createTaskService = async (
  data: CreateTaskInput,
  tenantId: string,
  actorUserId: string,
) => {
  // Validate project
  const project = await getProjectByIdAndTenant(data.projectId, tenantId);

  if (!project) {
    logger.warn({ projectId: data.projectId, tenantId }, "Task project lookup failed");
    throw new NotFoundError("Project not found");
  }

  // Validate assigned user
  if (data.assignedTo) {
    await validateUserBelongsToTenant(data.assignedTo, tenantId, "Assigned user");
  }

  const task = await createTask({
    ...data,
    tenantId,
    createdBy: actorUserId,
  });

  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.TASK_CREATED,
    targetType: "task",
    targetId: task._id.toString(),
    details: {
      title: task.title,
      status: task.status,
    },
  });

  emitTenantNotification(tenantId, {
    type: "task.created",
    message: "A new task was created",
    data: {
      taskId: task._id.toString(),
      title: task.title,
      status: task.status,
    },
  });

  return task;
};

const getTasksService = async (tenantId: string, query: TaskListQuery) => {
  const result = await getTasksByTenant(tenantId, query);

  return buildPaginationResponse(result.tasks, query, result.total);
};

const getTaskByIdService = async (taskId: string, tenantId: string) => {
  const task = await getTaskById(taskId);

  return assertSameTenant(task, tenantId, "Task");
};
const updateTaskService = async (
  taskId: string,
  data: UpdateTaskInput,
  tenantId: string,
  actorUserId: string,
) => {
  const existingTask = assertSameTenant(
    await getTaskById(taskId),
    tenantId,
    "Task",
  );

  const task = await updateTaskById(taskId, tenantId, data);

  if (!task) {
    throw createNotFoundError("Task");
  }

  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.TASK_UPDATED,
    targetType: "task",
    targetId: task._id.toString(),
    details: {
      previousTask: {
        title: existingTask.title,
        status: existingTask.status,
      },
      updatedTask: {
        title: task.title,
        status: task.status,
      },
    },
  });

  emitTenantNotification(tenantId, {
    type: "task.updated",
    message: "Task updated successfully",
    data: {
      taskId: task._id.toString(),
      title: task.title,
      status: task.status,
    },
  });

  return task;
};

const deleteTaskService = async (
  taskId: string,
  tenantId: string,
  actorUserId: string,
) => {
  const task = assertSameTenant(await getTaskById(taskId), tenantId, "Task");

  // Delete task
  await deleteTaskById(taskId);

  // Emit socket notification
  emitTenantNotification(tenantId, {
    type: "task.deleted",
    message: "A task was deleted",
    data: {
      taskId: task._id.toString(),
      title: task.title,
      status: task.status,
    },
  });

  // Create audit log
  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.TASK_DELETED,
    targetType: "task",
    targetId: task._id.toString(),
    details: {
      title: task.title,
      status: task.status,
      priority: task.priority,
      projectId: task.projectId.toString(),
    },
  });

  return {
    id: task._id.toString(),
    title: task.title,
    status: task.status,
  };
};
const assignTaskService = async (
  taskId: string,
  assignedTo: string,
  tenantId: string,
  actorUserId: string,
) => {
  // Check task exists
  const existingTask = assertSameTenant(
    await getTaskById(taskId),
    tenantId,
    "Task",
  );

  // Check assigned user exists
  await validateUserBelongsToTenant(assignedTo, tenantId, "Assigned user");
  if (existingTask.assignedTo?.toString() === assignedTo) {
    throw new ConflictError("Task is already assigned to this user");
  }
  // Assign task
  const task = await assignTaskToUser(taskId, tenantId, assignedTo);

  if (!task) {
    throw createNotFoundError("Task");
  }

  // Audit log
  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.TASK_ASSIGNED,
    targetType: "task",
    targetId: task._id.toString(),
    details: {
      previousAssignee: existingTask.assignedTo?.toString() ?? null,
      newAssignee: assignedTo,
      taskTitle: task.title,
    },
  });

  // Socket notification
  emitTenantNotification(tenantId, {
    type: "task.assigned",
    message: "Task assigned successfully",
    data: {
      taskId: task._id.toString(),
      title: task.title,
      assignedTo,
    },
  });

  return task;
};

const updateTaskStatusService = async (
  taskId: string,
  status: TaskStatus,
  tenantId: string,
  actorUserId: string,
) => {
  const existingTask = assertSameTenant(
    await getTaskById(taskId),
    tenantId,
    "Task",
  );

  const task = await updateTaskStatus(taskId, tenantId, status);

  if (!task) {
    throw createNotFoundError("Task");
  }

  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.TASK_STATUS_CHANGED,
    targetType: "task",
    targetId: task._id.toString(),
    details: {
      previousStatus: existingTask.status,
      newStatus: task.status,
    },
  });

  emitTenantNotification(tenantId, {
    type: "task.status_changed",
    message: "Task status updated successfully",
    data: {
      taskId: task._id.toString(),
      status: task.status,
    },
  });

  return task;
};
export {
  createTaskService,
  getTasksService,
  getTaskByIdService,
  updateTaskService,
  deleteTaskService,
  assignTaskService,
  updateTaskStatusService,
};
