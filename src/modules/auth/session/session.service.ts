import { UserRole } from "../../../common/constants/roles";
import { NotFoundError, UnauthorizedError } from "../../../common/errors/app-error";
import { generateToken } from "../../../common/utils/jwt.util";
import {
  findActiveSessionByRefreshTokenHash,
  getActiveSessionsByUser,
  revokeSessionById,
  revokeSessionByRefreshTokenHash,
  updateSessionRefreshToken,
} from "./session.repository";
import {
  createRefreshToken,
  getRefreshTokenExpiry,
  hashRefreshToken,
} from "./session.util";

const formatSession = (session: any) => ({
  id: session._id.toString(),
  userAgent: session.userAgent,
  ipAddress: session.ipAddress,
  expiresAt: session.expiresAt,
  lastUsedAt: session.lastUsedAt,
  createdAt: session.createdAt,
});

const refreshAccessTokenService = async (refreshToken: string) => {
  const currentHash = hashRefreshToken(refreshToken);
  const session = await findActiveSessionByRefreshTokenHash(currentHash);

  if (!session) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const user = session.userId as any;

  const accessToken = generateToken({
    userId: user._id.toString(),
    tenantId: session.tenantId.toString(),
    role: user.role as UserRole,
  });

  const newRefreshToken = createRefreshToken();

  await updateSessionRefreshToken(
    session._id.toString(),
    hashRefreshToken(newRefreshToken),
    getRefreshTokenExpiry(),
  );

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

const logoutService = async (refreshToken: string) => {
  const revokedSession = await revokeSessionByRefreshTokenHash(
    hashRefreshToken(refreshToken),
  );

  if (!revokedSession) {
    throw new NotFoundError("Session not found");
  }

  return { sessionId: revokedSession._id.toString() };
};

const getSessionsService = async (userId: string, tenantId: string) => {
  const sessions = await getActiveSessionsByUser(userId, tenantId);
  return sessions.map(formatSession);
};

const revokeSessionService = async (
  sessionId: string,
  userId: string,
  tenantId: string,
) => {
  const session = await revokeSessionById(sessionId, userId, tenantId);

  if (!session) {
    throw new NotFoundError("Session not found");
  }

  return { sessionId: session._id.toString() };
};

export {
  refreshAccessTokenService,
  logoutService,
  getSessionsService,
  revokeSessionService,
};
