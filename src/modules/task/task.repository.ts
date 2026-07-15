import { Task } from "./task.model";
import { TaskStatus } from "../../common/constants/task-status";
import { Priority } from "../../common/constants/priorities";

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

const createTask = async (data: any) => {
  return Task.create(data);
};

const buildTaskFilter = (tenantId: string, query: TaskListQuery) => {
  const filter: any = {
    tenantId,
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.projectId) {
    filter.projectId = query.projectId;
  }

  if (query.assignedTo) {
    filter.assignedTo = query.assignedTo;
  }

  if (query.search) {
    filter.$or = [
      {
        title: {
          $regex: query.search,
          $options: "i",
        },
      },
      {
        description: {
          $regex: query.search,
          $options: "i",
        },
      },
    ];
  }

  return filter;
};

const getTasksByTenant = async (tenantId: string, query: TaskListQuery) => {
  const filter = buildTaskFilter(tenantId, query);

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .select("title description projectId assignedTo createdBy tenantId status priority dueDate createdAt updatedAt")
      .populate("projectId", "name")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .lean(),

    Task.countDocuments(filter),
  ]);

  return {
    tasks,
    total,
  };
};

const getTaskById = async (taskId: string) => {
  return Task.findById(taskId)
    .populate("projectId", "name")
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email");
};

const updateTaskById = async (taskId: string, tenantId: string, data: any) => {
  return Task.findOneAndUpdate(
    {
      _id: taskId,
      tenantId,
    },
    data,
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("projectId", "name")
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email");
};

const deleteTaskById = async (taskId: string) => {
  return Task.findByIdAndDelete(taskId);
};

const countTasksByProject = async (projectId: string, tenantId: string) => {
  return Task.countDocuments({
    projectId,
    tenantId,
  });
};

const assignTaskToUser = async (
  taskId: string,
  tenantId: string,
  assignedTo: string,
) => {
  return Task.findOneAndUpdate(
    {
      _id: taskId,
      tenantId,
    },
    {
      assignedTo,
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("projectId", "name")
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email");
};

const updateTaskStatus = async (
  taskId: string,
  tenantId: string,
  status: TaskStatus,
) => {
  return Task.findOneAndUpdate(
    {
      _id: taskId,
      tenantId,
    },
    {
      status,
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("projectId", "name")
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email");
};

export {
  createTask,
  getTasksByTenant,
  getTaskById,
  updateTaskById,
  deleteTaskById,
  countTasksByProject,
  assignTaskToUser,
  updateTaskStatus,
};
