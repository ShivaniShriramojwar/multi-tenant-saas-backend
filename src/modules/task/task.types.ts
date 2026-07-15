import { Priority } from "../../common/constants/priorities";
import { TaskStatus } from "../../common/constants/task-status";

interface CreateTaskInput {
  title: string;
  description: string;
  projectId: string;
  assignedTo?: string;
  priority?: Priority;
  status?: TaskStatus;
  dueDate?: Date;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  assignedTo?: string;
  priority?: Priority;
  status?: TaskStatus;
  dueDate?: Date;
}

interface TaskListQuery {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  status?: TaskStatus;
  priority?: Priority;
  projectId?: string;
  assignedTo?: string;
}

export { CreateTaskInput, UpdateTaskInput, TaskListQuery };
