import { NextFunction, Response } from "express";
import { AuthRequest } from "../../common/interfaces/auth.interface";
import { getPagination } from "../../common/utils/pagination.util";

import {
  createCommentService,
  getCommentsService,
  getCommentByIdService,
  updateCommentService,
  deleteCommentService,
} from "./comment.service";

import { EntityType } from "../../common/constants/entity-type";

const createCommentController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;

    const comment = await createCommentService(
      req.body,
      req.user!.tenantId,
      req.user!.userId,
      files || [],
    );

    return res.status(201).json({
      message: "Comment created successfully",
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

const getCommentsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;

    const pagination = getPagination(req.query);

    const { data, pagination: paginationMeta } = await getCommentsService(
      tenantId,
      {
        ...pagination,
        entityType: req.query.entityType?.toString() as EntityType | undefined,
        entityId: req.query.entityId?.toString(),
        createdBy: req.query.createdBy?.toString(),
        search: req.query.search?.toString(),
      },
    );

    return res.status(200).json({
      message: "Comments fetched successfully",
      data,
      pagination: paginationMeta,
    });
  } catch (error) {
    next(error);
  }
};

const getCommentByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const comment = await getCommentByIdService(
      req.params.id,
      req.user!.tenantId,
    );

    return res.status(200).json({
      message: "Comment fetched successfully",
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

const updateCommentController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const comment = await updateCommentService(
      req.params.id,
      req.body,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Comment updated successfully",
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCommentController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const comment = await deleteCommentService(
      req.params.id,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Comment deleted successfully",
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createCommentController,
  getCommentsController,
  getCommentByIdController,
  updateCommentController,
  deleteCommentController,
};
