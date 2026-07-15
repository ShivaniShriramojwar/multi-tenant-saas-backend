import { NextFunction, Response } from "express";
import { AuthRequest } from "../../common/interfaces/auth.interface";

import {
  createProjectService,
  deleteProjectService,
  getProjectByIdService,
  getProjectsService,
  updateProjectService,
} from "./project.service";
import { getPagination } from "../../common/utils/pagination.util";

const createProjectController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;

    const project = await createProjectService(req.body, tenantId, userId);

    return res.status(201).json({
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

const getProjectsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;

    const pagination = getPagination(req.query);

    const { data, pagination: paginationMeta } = await getProjectsService(
      tenantId,
      {
        ...pagination,
        search: req.query.search?.toString(),
        status: req.query.status?.toString(),
      },
    );

    return res.status(200).json({
      message: "Projects fetched successfully",
      data,
      pagination: paginationMeta,
    });
  } catch (error) {
    next(error);
  }
};
const getProjectByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await getProjectByIdService(
      req.params.id,
      req.user!.tenantId,
    );

    return res.status(200).json({
      message: "Project fetched successfully",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

const updateProjectController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await updateProjectService(
      req.params.id,
      req.body,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Project updated successfully",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProjectController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await deleteProjectService(
      req.params.id,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Project deleted successfully",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};
export {
  createProjectController,
  getProjectsController,
  getProjectByIdController,
  updateProjectController,
  deleteProjectController,
};
