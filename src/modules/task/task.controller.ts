import { NextFunction, Response } from "express";
import { AuthRequest } from "../../common/interfaces/auth.interface";
import {
  assignTaskService,
  createTaskService,
  deleteTaskService,
  getTaskByIdService,
  getTasksService,
  updateTaskService,
  updateTaskStatusService,
} from "./task.service";
import { getPagination } from "../../common/utils/pagination.util";
import { TaskStatus } from "../../common/constants/task-status";
import { Priority } from "../../common/constants/priorities";

const createTaskController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await createTaskService(
      req.body,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(201).json({
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

const getTasksController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;

    const pagination = getPagination(req.query);

    const { data, pagination: paginationMeta } = await getTasksService(
      tenantId,
      {
        ...pagination,
        search: req.query.search?.toString(),
        status: req.query.status?.toString() as TaskStatus | undefined,
        priority: req.query.priority?.toString() as Priority | undefined,
        projectId: req.query.projectId?.toString(),
        assignedTo: req.query.assignedTo?.toString(),
      },
    );

    return res.status(200).json({
      message: "Tasks fetched successfully",
      data,
      pagination: paginationMeta,
    });
  } catch (error) {
    next(error);
  }
};

const getTaskByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await getTaskByIdService(req.params.id, req.user!.tenantId);

    return res.status(200).json({
      message: "Task fetched successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

const updateTaskController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await updateTaskService(
      req.params.id,
      req.body,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTaskController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await deleteTaskService(
      req.params.id,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Task deleted successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

const assignTaskController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await assignTaskService(
      req.params.id,
      req.body.assignedTo,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Task assigned successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

const updateTaskStatusController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await updateTaskStatusService(
      req.params.id,
      req.body.status,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Task status updated successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};
export {
  createTaskController,
  getTasksController,
  getTaskByIdController,
  updateTaskController,
  deleteTaskController,
  assignTaskController,
  updateTaskStatusController,
};
