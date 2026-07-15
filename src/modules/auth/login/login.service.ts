import bcrypt from "bcryptjs";
import {
  findUserByEmail,
  recordFailedLogin,
  resetLoginFailures,
} from "./login.repository";
import { LoginInput, LoginResponse } from "./login.interface";
import { generateToken } from "../../../common/utils/jwt.util";
import { UnauthorizedError } from "../../../common/errors/app-error";
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

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_MINUTES = 15;

const getLockExpiry = () => {
  return new Date(Date.now() + ACCOUNT_LOCK_MINUTES * 60 * 1000);
};

const loginUserService = async (
  data: LoginInput,
  meta: LoginMeta,
): Promise<LoginResponse> => {
  const { email, password } = data;

  // 1. Check user exists
  const user = await findUserByEmail(email);

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // 2. Compare password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    const lockedUntil = failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS
      ? getLockExpiry()
      : undefined;

    await recordFailedLogin(
      user._id.toString(),
      failedLoginAttempts,
      lockedUntil,
    );

    throw new UnauthorizedError("Invalid email or password");
  }

  if ((user.failedLoginAttempts || 0) > 0 || user.lockedUntil) {
    await resetLoginFailures(user._id.toString());
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

    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

export { loginUserService };
