import bcrypt from "bcryptjs";
import { findUserByEmail } from "./login.repository";
import { LoginInput, LoginResponse } from "./login.interface";
import { generateToken } from "../../../common/utils/jwt.util";
import {
  createRefreshToken,
  getRefreshTokenExpiry,
  hashRefreshToken,
} from "../session/session.util";
import { createSession } from "../session/session.repository";

interface LoginMeta {
  userAgent?: string;
  ipAddress?: string;
}

const loginUserService = async (
  data: LoginInput,
  meta: LoginMeta,
): Promise<LoginResponse> => {
  const { email, password } = data;

  // 1. Check user exists
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // 2. Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // 3. Generate tokens
  const accessToken = generateToken({
    userId: user._id.toString(),
    tenantId: user.tenantId.toString(),
    role: user.role,
  });

  const refreshToken = createRefreshToken();

  await createSession({
    userId: user._id.toString(),
    tenantId: user.tenantId.toString(),
    refreshTokenHash: hashRefreshToken(refreshToken),
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
    expiresAt: getRefreshTokenExpiry(),
  });

  // 4. Return response
  return {
    accessToken,
    refreshToken,
    token: accessToken,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

export { loginUserService };
