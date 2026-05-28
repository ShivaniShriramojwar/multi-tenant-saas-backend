import bcrypt from "bcryptjs";
import { UserRole } from "../../common/interfaces/auth.interface";
import { getPaginationMeta } from "../../common/utils/pagination.util";
import { emitTenantNotification } from "../../infrastructure/socket/socket";
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
import { uploadToCloudinary } from "../../infrastructure/storage/cloudinary";

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

  if (tenantId && typeof tenantId === "object" && "name" in tenantId) {
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
    tenant,
  };
};

/**
 * 🔹 Get logged-in user profile
 */
const getUserProfileService = async (userId: string) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return formatUserResponse(user);
};
const createUserService = async (data: CreateUserInput, tenantId: string) => {
  const { name, email, password, role } = data;

  if (role === "admin") {
    throw new Error("Creating admin users requires manage_roles permission");
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("User already exists");
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

  return createdUser;
};

const createUserWithRoleManagementService = async (
  data: CreateUserInput,
  tenantId: string,
  canManageRoles: boolean,
  actorUserId: string,
) => {
  if (data.role === "admin" && !canManageRoles) {
    throw new Error("Creating admin users requires manage_roles permission");
  }

  const { name, email, password, role } = data;

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("User already exists");
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
    action: "user.created",
    targetType: "user",
    targetId: user._id.toString(),
    details: {
      createdUser,
    },
  });

  return createdUser;
};
/**
 * 🔹 Get all users of same tenant
 */
const getUsersService = async (
  userId: string,
  tenantId: string,
  role: UserRole,
  query: UserListQuery,
) => {
  if (role === "admin" || role === "manager") {
    const result = await getUsersByTenant(tenantId, query);

    return {
      data: result.users.map(formatUserResponse),
      pagination: getPaginationMeta(query.page, query.limit, result.total),
    };
  }

  // normal user → only self
  const user = await getUserById(userId);
  return {
    data: user ? [formatUserResponse(user)] : [],
    pagination: getPaginationMeta(query.page, query.limit, user ? 1 : 0),
  };
};

const deleteUserService = async (
  targetUserId: string,
  tenantId: string,
  currentUserId: string,
) => {
  if (targetUserId === currentUserId) {
    throw new Error("Admin cannot delete their own account");
  }

  const user = await getUserById(targetUserId);

  const userTenant = getTenantInfo(user?.tenantId);

  if (!user || userTenant.id !== tenantId) {
    const error = new Error("User not found") as any;
    error.statusCode = 404;
    throw error;
  }

  await deleteUserById(targetUserId);

  const deletedUser = formatUserResponse(user);

  emitTenantNotification(tenantId, {
    type: "user.deleted",
    message: "A user was deleted",
    data: deletedUser,
  });

  return deletedUser;
};

const updateUserRoleService = async (
  targetUserId: string,
  role: UserRole,
  tenantId: string,
  actorUserId: string,
) => {
  const user = await getUserById(targetUserId);
  const userTenant = getTenantInfo(user?.tenantId);

  if (!user || userTenant.id !== tenantId) {
    const error = new Error("User not found") as any;
    error.statusCode = 404;
    throw error;
  }

  const previousRole = user.role;

  if (previousRole === role) {
    return formatUserResponse(user);
  }

  const updatedUser = await updateUserRoleById(targetUserId, role);

  await createAuditLog({
    tenantId,
    actorUserId,
    action: "user.role_changed",
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
    throw new Error("User not found");
  }

  return formatUserResponse(user);
};

export {
  getUserProfileService,
  getUsersService,
  createUserService,
  createUserWithRoleManagementService,
  deleteUserService,
  updateUserRoleService,
  uploadProfileImageService,
};
