import { NextFunction, Response } from "express";

import { AuthRequest } from "../../common/interfaces/auth.interface";
import { getPagination } from "../../common/utils/pagination.util";

import {
  getEmailLogByIdService,
  getEmailLogsService,
  getEmailSummaryService,
  retryEmailService,
  sendEmailService,
} from "./email.service";

const sendEmailController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const emailLog = await sendEmailService(
      req.body,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(201).json({
      message: "Email processed successfully",
      data: emailLog,
    });
  } catch (error) {
    next(error);
  }
};

const getEmailLogsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pagination = getPagination(req.query);
    const filters = req.query;
    const { data, pagination: paginationMeta } = await getEmailLogsService(
      req.user!.tenantId,
      {
        ...pagination,
        ...filters,
      },
    );

    return res.status(200).json({
      message: "Email logs fetched successfully",
      data,
      pagination: paginationMeta,
    });
  } catch (error) {
    next(error);
  }
};

const getEmailSummaryController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filters = req.query;
    const data = await getEmailSummaryService(req.user!.tenantId, filters);

    return res.status(200).json({
      message: "Email summary fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getEmailLogByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const emailLog = await getEmailLogByIdService(
      req.params.id,
      req.user!.tenantId,
    );

    return res.status(200).json({
      message: "Email log fetched successfully",
      data: emailLog,
    });
  } catch (error) {
    next(error);
  }
};

const retryEmailController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const emailLog = await retryEmailService(req.params.id, req.user!.tenantId);

    return res.status(200).json({
      message: "Email retried successfully",
      data: emailLog,
    });
  } catch (error) {
    next(error);
  }
};

export {
  sendEmailController,
  getEmailLogsController,
  getEmailSummaryController,
  getEmailLogByIdController,
  retryEmailController,
};
