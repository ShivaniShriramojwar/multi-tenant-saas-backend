import { Response } from "express";
import { AuthRequest } from "../../common/interfaces/auth.interface";
import { getPagination } from "../../common/utils/pagination.util";
import {
  createOrderService,
  deleteOrderService,
  getOrderByIdService,
  getOrdersService,
  uploadInvoicePdfService,
  uploadOrderAttachmentsService,
} from "./order.service";

const createOrderController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;

    const order = await createOrderService(req.body, userId, tenantId);

    return res.status(201).json({
      message: "Order created successfully",
      data: order,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

const getOrdersController = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await getOrdersService(
      req.user!.userId,
      req.user!.tenantId,
      req.user!.role,
      {
        ...getPagination(req.query),
        search: req.query.search?.toString(),
        status: req.query.status?.toString(),
        paymentStatus: req.query.paymentStatus?.toString(),
      },
    );

    return res.status(200).json({
      message: "Orders fetched successfully",
      data: orders.data,
      pagination: orders.pagination,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

const getOrderByIdController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await getOrderByIdService(
      id,
      req.user!.userId,
      req.user!.tenantId,
      req.user!.role,
    );

    return res.status(200).json({
      message: "Order fetched successfully",
      data: order,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

const deleteOrderController = async (req: AuthRequest, res: Response) => {
  try {
    const deletedOrder = await deleteOrderService(
      req.params.id,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "Order deleted successfully",
      data: deletedOrder,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

const uploadInvoicePdfController = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Invoice PDF is required" });
    }

    const order = await uploadInvoicePdfService(
      req.params.id,
      req.user!.tenantId,
      req.file,
    );

    return res.status(200).json({
      message: "Invoice PDF uploaded successfully",
      data: order,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

const uploadOrderAttachmentsController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "At least one attachment is required" });
    }

    const order = await uploadOrderAttachmentsService(
      req.params.id,
      req.user!.tenantId,
      files,
    );

    return res.status(200).json({
      message: "Order attachments uploaded successfully",
      data: order,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

export {
  createOrderController,
  getOrdersController,
  getOrderByIdController,
  deleteOrderController,
  uploadInvoicePdfController,
  uploadOrderAttachmentsController,
};
