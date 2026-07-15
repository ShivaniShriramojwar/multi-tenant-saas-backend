import bcrypt from "bcryptjs";
import mongoose, { HydratedDocument } from "mongoose";

import {
  createTenant,
  createUser,
  findUserByEmail,
} from "./register.repository";

import { RegisterInput, RegisterResponse } from "./register.interface";
import { createAuditLog, createAuditLogWithSession } from "../../audit/audit.service";
import { ROLES } from "../../../common/constants/roles";
import { AUDIT_ACTION } from "../../../common/constants/audit-actions";
import { ConflictError } from "../../../common/errors/app-error";
import { ITenant } from "../../tenant/tenant.model";
import { IUser } from "../../user/user.types";

const registerUserService = async (
  data: RegisterInput,
): Promise<RegisterResponse> => {
  const { name, email, password, tenantName } = data;

  // Check if user already exists
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new ConflictError("User already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  let tenant: HydratedDocument<ITenant> | undefined;
  let user: HydratedDocument<IUser> | undefined;

  const auditLogData = () => {
    if (!tenant || !user) {
      throw new Error("Registration records were not created");
    }

    return {
      tenantId: tenant._id.toString(),
      actorUserId: user._id.toString(),
      action: AUDIT_ACTION.USER_CREATED,
      targetType: "user" as const,
      targetId: user._id.toString(),
      details: {
        name: user.name,
        email: user.email,
        role: user.role,
        source: "registration",
      },
    };
  };

  if (process.env.MONGO_USE_TRANSACTIONS === "true") {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Create tenant
        tenant = await createTenant(tenantName, session);

        // Create first user as Super Admin
        user = await createUser(
          {
            name,
            email,
            password: hashedPassword,
            tenantId: tenant._id,
            role: ROLES.SUPER_ADMIN,
          },
          session,
        );

        // Audit log
        await createAuditLogWithSession(auditLogData(), session);
      });
    } finally {
      await session.endSession();
    }
  } else {
    try {
      // Create tenant
      tenant = await createTenant(tenantName);

      // Create first user as Super Admin
      user = await createUser(
        {
          name,
          email,
          password: hashedPassword,
          tenantId: tenant._id,
          role: ROLES.SUPER_ADMIN,
        },
      );

      // Audit log
      await createAuditLog(auditLogData());
    } catch (error) {
      await Promise.allSettled([user?.deleteOne(), tenant?.deleteOne()]);
      throw error;
    }
  }

  if (!tenant || !user) {
    throw new Error("Registration failed");
  }

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId.toString(),
    },
    tenant: {
      id: tenant._id.toString(),
      name: tenant.name,
    },
  };
};

export { registerUserService };
