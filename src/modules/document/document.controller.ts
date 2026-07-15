import { NextFunction, Response } from "express";
import { AuthRequest } from "../../common/interfaces/auth.interface";
import { getPagination } from "../../common/utils/pagination.util";
import { DocumentCategory } from "../../common/constants/document-category";
import { EntityType } from "../../common/constants/entity-type";
import {
  deleteDocumentService,
  getDocumentByIdService,
  getDocumentDownloadUrlService,
  getDocumentsService,
  updateDocumentService,
  uploadDocumentsService,
} from "./document.service";

const uploadDocumentsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: "At least one document is required",
      });
    }

    const documents = await uploadDocumentsService(
      req.body,
      req.user!.tenantId,
      req.user!.userId,
      files,
    );

    return res.status(201).json({
      message: "Documents uploaded successfully",
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

const getDocumentsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pagination = getPagination(req.query);

    const { data, pagination: paginationMeta } = await getDocumentsService(
      req.user!.tenantId,
      {
        ...pagination,
        search: req.query.search?.toString(),
        category: req.query.category?.toString() as DocumentCategory,
        entityType: req.query.entityType?.toString() as EntityType,
        entityId: req.query.entityId?.toString(),
        projectId: req.query.projectId?.toString(),
        taskId: req.query.taskId?.toString(),
        bugId: req.query.bugId?.toString(),
        orderId: req.query.orderId?.toString(),
        uploadedBy: req.query.uploadedBy?.toString(),
        mimeType: req.query.mimeType?.toString(),
      },
    );

    return res.status(200).json({
      message: "Documents fetched successfully",
      data,
      pagination: paginationMeta,
    });
  } catch (error) {
    next(error);
  }
};

const getDocumentByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const document = await getDocumentByIdService(
      req.params.id,
      req.user!.tenantId,
    );

    return res.status(200).json({
      message: "Document fetched successfully",
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

const getDocumentDownloadUrlController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const download = await getDocumentDownloadUrlService(
      req.params.id,
      req.user!.tenantId,
    );

    return res.status(200).json({
      message: "Document download URL generated successfully",
      data: download,
    });
  } catch (error) {
    next(error);
  }
};

const updateDocumentController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const document = await updateDocumentService(
      req.params.id,
      req.body,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Document updated successfully",
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

const deleteDocumentController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const document = await deleteDocumentService(
      req.params.id,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Document deleted successfully",
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export {
  uploadDocumentsController,
  getDocumentsController,
  getDocumentByIdController,
  getDocumentDownloadUrlController,
  updateDocumentController,
  deleteDocumentController,
};
