import { NextFunction, Response } from "express";
import { AuthRequest } from "../../common/interfaces/auth.interface";

import {
  createBugService,
  getBugsService,
  getBugByIdService,
  updateBugService,
  deleteBugService,
  assignBugService,
  updateBugStatusService,
  updateBugSeverityService,
} from "./bug.service";

import { getPagination } from "../../common/utils/pagination.util";

import { Severity } from "../../common/constants/severity";
import { BugStatus } from "../../common/constants/bug-status";

const createBugController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bug = await createBugService(
      req.body,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(201).json({
      message: "Bug created successfully",
      data: bug,
    });
  } catch (error) {
    next(error);
  }
};

const getBugsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;

    const pagination = getPagination(req.query);

    const { data, pagination: paginationMeta } = await getBugsService(
      tenantId,
      {
        ...pagination,
        search: req.query.search?.toString(),
        status: req.query.status?.toString() as BugStatus | undefined,
        severity: req.query.severity?.toString() as Severity | undefined,
        projectId: req.query.projectId?.toString(),
        taskId: req.query.taskId?.toString(),
        assignedTo: req.query.assignedTo?.toString(),
        reportedBy: req.query.reportedBy?.toString(),
      },
    );

    return res.status(200).json({
      message: "Bugs fetched successfully",
      data,
      pagination: paginationMeta,
    });
  } catch (error) {
    next(error);
  }
};
const getBugByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bug = await getBugByIdService(req.params.id, req.user!.tenantId);

    return res.status(200).json({
      message: "Bug fetched successfully",
      data: bug,
    });
  } catch (error) {
    next(error);
  }
};

const updateBugController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bug = await updateBugService(
      req.params.id,
      req.body,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Bug updated successfully",
      data: bug,
    });
  } catch (error) {
    next(error);
  }
};
const deleteBugController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bug = await deleteBugService(
      req.params.id,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Bug deleted successfully",
      data: bug,
    });
  } catch (error) {
    next(error);
  }
};

const assignBugController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bug = await assignBugService(
      req.params.id,
      req.body.assignedTo,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Bug assigned successfully",
      data: bug,
    });
  } catch (error) {
    next(error);
  }
};

const updateBugStatusController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bug = await updateBugStatusService(
      req.params.id,
      req.body.status,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Bug status updated successfully",
      data: bug,
    });
  } catch (error) {
    next(error);
  }
};

const updateBugSeverityController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bug = await updateBugSeverityService(
      req.params.id,
      req.body.severity,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Bug severity updated successfully",
      data: bug,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createBugController,
  getBugsController,
  getBugByIdController,
  updateBugController,
  deleteBugController,
  assignBugController,
  updateBugStatusController,
  updateBugSeverityController,
};
