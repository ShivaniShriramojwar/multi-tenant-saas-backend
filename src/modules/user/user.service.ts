import bcrypt from "bcryptjs";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../common/errors/app-error";

import { ROLES, UserRole } from "../../common/constants/roles";
import { AUDIT_ACTION } from "../../common/constants/audit-actions";
import {
  getPermissionsForRole,
  hasPermission,
} from "../../common/permissions/role-permissions";
import { getPaginationMeta } from "../../common/utils/pagination.util";

import { emitTenantNotification } from "../../infrastructure/socket/socket";
import { uploadToCloudinary } from "../../infrastructure/storage/cloudinary";

import { createAuditLog } from "../audit/audit.service";

import {
  createUser,
  findUserByEmail,
} from "../auth/register/register.repository";

import {
  deleteUserById,
  getUserById,
  getUsersByTenant,
  updateUserProfileImage,
  updateUserRoleById,
} from "./user.repository";

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface UserListQuery {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  role?: string;
}

const getTenantInfo = (tenantId: any) => {
  if (!tenantId) {
    return {
      id: "",
      name: undefined,
    };
  }

  if (typeof tenantId === "object" && "name" in tenantId) {
    return {
      id: tenantId._id.toString(),
      name: tenantId.name,
    };
  }

  return {
    id: tenantId.toString(),
    name: undefined,
  };
};

const formatUserResponse = (user: any) => {
  const tenant = getTenantInfo(user.tenantId);

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: getPermissionsForRole(user.role),
    tenantId: tenant.id,
    tenant,
    profileImage: user.profileImage,
  };
};

/**
 * Get logged-in user profile
 */
const getUserProfileService = async (userId: string) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return formatUserResponse(user);
};

/**
 * Create user
 */
const createUserWithRoleManagementService = async (
  data: CreateUserInput,
  tenantId: string,
  actorUserId: string,
  actorRole: UserRole,
) => {
  if (
    data.role === ROLES.SUPER_ADMIN &&
    !hasPermission(actorRole, "manage_roles")
  ) {
    throw new ForbiddenError("You do not have permission to create a Super Admin user.");
  }

  const { name, email, password, role } = data;

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new ConflictError("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await createUser({
    name,
    email,
    password: hashedPassword,
    tenantId,
    role,
  });

  const createdUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    tenant: {
      id: user.tenantId.toString(),
    },
  };

  emitTenantNotification(tenantId, {
    type: "user.created",
    message: "A new user was created",
    data: createdUser,
  });

  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.USER_CREATED,
    targetType: "user",
    targetId: user._id.toString(),
    details: createdUser,
  });

  return createdUser;
};

/**
 * Get users
 */
const getUsersService = async (
  userId: string,
  tenantId: string,
  role: UserRole,
  query: UserListQuery,
) => {
  if (hasPermission(role, "manage_users")) {
    const result = await getUsersByTenant(tenantId, query);

    return {
      data: result.users.map(formatUserResponse),
      pagination: getPaginationMeta(query.page, query.limit, result.total),
    };
  }

  const user = await getUserById(userId);

  return {
    data: user ? [formatUserResponse(user)] : [],
    pagination: getPaginationMeta(query.page, query.limit, user ? 1 : 0),
  };
};

/**
 * Delete user
 */
const deleteUserService = async (
  targetUserId: string,
  tenantId: string,
  currentUserId: string,
) => {
  if (targetUserId === currentUserId) {
    throw new BadRequestError("You cannot delete your own account");
  }

  const user = await getUserById(targetUserId);

  const userTenant = getTenantInfo(user?.tenantId);

  if (!user || userTenant.id !== tenantId) {
    throw new NotFoundError("User not found");
  }

  await deleteUserById(targetUserId);

  const deletedUser = formatUserResponse(user);

  emitTenantNotification(tenantId, {
    type: "user.deleted",
    message: "A user was deleted",
    data: deletedUser,
  });

  await createAuditLog({
    tenantId,
    actorUserId: currentUserId,
    action: AUDIT_ACTION.USER_DELETED,
    targetType: "user",
    targetId: targetUserId,
    details: deletedUser,
  });

  return deletedUser;
};

/**
 * Update user role
 */
const updateUserRoleService = async (
  targetUserId: string,
  role: UserRole,
  tenantId: string,
  actorUserId: string,
) => {
  if (targetUserId === actorUserId) {
    throw new BadRequestError("You cannot change your own role");
  }

  const user = await getUserById(targetUserId);

  const userTenant = getTenantInfo(user?.tenantId);

  if (!user || userTenant.id !== tenantId) {
    throw new NotFoundError("User not found");
  }

  const previousRole = user.role;

  if (previousRole === role) {
    return formatUserResponse(user);
  }

  const updatedUser = await updateUserRoleById(targetUserId, role);

  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.USER_ROLE_CHANGED,
    targetType: "user",
    targetId: targetUserId,
    details: {
      previousRole,
      newRole: role,
    },
  });

  emitTenantNotification(tenantId, {
    type: "user.role_changed",
    message: "A user role was changed",
    data: {
      userId: targetUserId,
      previousRole,
      newRole: role,
    },
  });

  return formatUserResponse(updatedUser);
};

/**
 * Upload profile image
 */
const uploadProfileImageService = async (
  userId: string,
  tenantId: string,
  file: Express.Multer.File,
) => {
  const uploaded = await uploadToCloudinary({
    buffer: file.buffer,
    folder: `backend-saas/${tenantId}/profile-images`,
    resourceType: "image",
    publicId: userId,
  });

  const user = await updateUserProfileImage(userId, {
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    uploadedAt: new Date(),
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return formatUserResponse(user);
};

export {
  getUserProfileService,
  getUsersService,
  createUserWithRoleManagementService,
  deleteUserService,
  updateUserRoleService,
  uploadProfileImageService,
};
