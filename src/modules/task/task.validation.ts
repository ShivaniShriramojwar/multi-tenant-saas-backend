import { z } from "zod";
import { TASK_STATUS, TASK_STATUSES } from "../../common/constants/task-status";
import { PRIORITY, PRIORITIES } from "../../common/constants/priorities";
import {
  idParamSchema,
  objectIdSchema,
  optionalObjectIdSchema,
} from "../../common/middleware/validate.middleware";

const createTaskSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),

  description: z.string().trim().min(5, "Description is required"),

  projectId: objectIdSchema,

  assignedTo: optionalObjectIdSchema,

  status: z.enum(TASK_STATUSES).default(TASK_STATUS.TODO),

  priority: z.enum(PRIORITIES).default(PRIORITY.MEDIUM),

  dueDate: z.coerce.date().optional(),
});

const assignTaskSchema = z.object({
  assignedTo: objectIdSchema,
});

const updateTaskStatusSchema = z.object({
  status: z.enum(TASK_STATUSES),
});
const updateTaskSchema = createTaskSchema.partial();
const getTasksQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  projectId: optionalObjectIdSchema,
  assignedTo: optionalObjectIdSchema,
});
const taskIdSchema = idParamSchema;

export {
  createTaskSchema,
  getTasksQuerySchema,
  taskIdSchema,
  updateTaskSchema,
  assignTaskSchema,
  updateTaskStatusSchema,
};
