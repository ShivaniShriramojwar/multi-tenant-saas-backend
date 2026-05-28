import { Response } from "express";
import { AuthRequest } from "../../common/interfaces/auth.interface";
import {
  createUserWithRoleManagementService,
  deleteUserService,
  getUserProfileService,
  getUsersService,
  updateUserRoleService,
  uploadProfileImageService,
} from "./user.service";
import { hasPermission } from "../../common/permissions/role-permissions";
import { getPagination } from "../../common/utils/pagination.util";
import { createUserSchema, updateUserRoleSchema } from "./user.validation";

/**
 * 🔹 Get logged-in user profile
 */
const getUserProfileController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await getUserProfileService(userId);

    return res.status(200).json({
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

const createUserController = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const validatedBody = createUserSchema.parse(req.body);
    const user = await createUserWithRoleManagementService(
      validatedBody,
      tenantId,
      hasPermission(req.user!.role, "manage_roles"),
      req.user!.userId,
    );

    return res.status(201).json({
      message: "User created successfully",
      data: user,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.issues?.[0]?.message || error.message,
    });
  }
};
/**
 * 🔹 Get all users of same tenant
 */
const getUsersController = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const role = req.user!.role;
    const pagination = getPagination(req.query);

    const users = await getUsersService(userId, tenantId, role, {
      ...pagination,
      search: req.query.search?.toString(),
      role: req.query.role?.toString(),
    });

    return res.status(200).json({
      message: "Users fetched successfully",
      data: users.data,
      pagination: users.pagination,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

const deleteUserController = async (req: AuthRequest, res: Response) => {
  try {
    const deletedUser = await deleteUserService(
      req.params.id,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "User deleted successfully",
      data: deletedUser,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 400).json({
      message: error.message,
    });
  }
};

const updateUserRoleController = async (req: AuthRequest, res: Response) => {
  try {
    const validatedBody = updateUserRoleSchema.parse(req.body);

    const user = await updateUserRoleService(
      req.params.id,
      validatedBody.role,
      req.user!.tenantId,
      req.user!.userId,
    );

    return res.status(200).json({
      message: "User role updated successfully",
      data: user,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 400).json({
      message: error.issues?.[0]?.message || error.message,
    });
  }
};

const uploadProfileImageController = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Profile image is required" });
    }

    const user = await uploadProfileImageService(
      req.user!.userId,
      req.user!.tenantId,
      req.file,
    );

    return res.status(200).json({
      message: "Profile image uploaded successfully",
      data: user,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export {
  getUserProfileController,
  getUsersController,
  createUserController,
  deleteUserController,
  updateUserRoleController,
  uploadProfileImageController,
};
