import bcrypt from "bcryptjs";
import {
  findUserByEmail,
  createTenant,
  createUser,
} from "./register.repository";
import { RegisterInput, RegisterResponse } from "./register.interface";
import { createAuditLog } from "../../audit/audit.service";

const registerUserService = async (
  data: RegisterInput,
): Promise<RegisterResponse> => {
  const { name, email, password, tenantName, role } = data;

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const tenant = await createTenant(tenantName);

  const user = await createUser({
    name,
    email,
    password: hashedPassword,
    tenantId: tenant._id,
    role,
  });

  await createAuditLog({
    tenantId: tenant._id.toString(),
    actorUserId: user._id.toString(),
    action: "user.created",
    targetType: "user",
    targetId: user._id.toString(),
    details: {
      name: user.name,
      email: user.email,
      role: user.role,
      source: "registration",
    },
  });

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
