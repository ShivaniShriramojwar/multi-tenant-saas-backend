import bcrypt from "bcryptjs";
import mongoose, { HydratedDocument } from "mongoose";

import {
  createTenant,
  createUser,
  findUserByEmail,
} from "./register.repository";

import { RegisterInput, RegisterResponse } from "./register.interface";
import { createAuditLogWithSession } from "../../audit/audit.service";
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

  const session = await mongoose.startSession();
  let tenant: HydratedDocument<ITenant> | undefined;
  let user: HydratedDocument<IUser> | undefined;

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
      await createAuditLogWithSession(
        {
          tenantId: tenant._id.toString(),
          actorUserId: user._id.toString(),
          action: AUDIT_ACTION.USER_CREATED,
          targetType: "user",
          targetId: user._id.toString(),
          details: {
            name: user.name,
            email: user.email,
            role: user.role,
            source: "registration",
          },
        },
        session,
      );
    });
  } finally {
    await session.endSession();
  }

  if (!tenant || !user) {
    throw new Error("Registration transaction failed");
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
