import { Session } from "./session.model";

interface CreateSessionInput {
  userId: string;
  tenantId: string;
  refreshTokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
}

const createSession = async (data: CreateSessionInput) => {
  return Session.create(data);
};

const findActiveSessionByRefreshTokenHash = async (refreshTokenHash: string) => {
  return Session.findOne({
    refreshTokenHash,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  }).populate("userId");
};

const updateSessionRefreshToken = async (
  sessionId: string,
  refreshTokenHash: string,
  expiresAt: Date,
) => {
  return Session.findByIdAndUpdate(
    sessionId,
    {
      refreshTokenHash,
      expiresAt,
      lastUsedAt: new Date(),
    },
    { returnDocument: "after" },
  );
};

const revokeSessionByRefreshTokenHash = async (refreshTokenHash: string) => {
  return Session.findOneAndUpdate(
    {
      refreshTokenHash,
      revokedAt: { $exists: false },
    },
    {
      revokedAt: new Date(),
    },
    { returnDocument: "after" },
  );
};

const revokeSessionById = async (
  sessionId: string,
  userId: string,
  tenantId: string,
) => {
  return Session.findOneAndUpdate(
    {
      _id: sessionId,
      userId,
      tenantId,
      revokedAt: { $exists: false },
    },
    {
      revokedAt: new Date(),
    },
    { returnDocument: "after" },
  );
};

const getActiveSessionsByUser = async (userId: string, tenantId: string) => {
  return Session.find({
    userId,
    tenantId,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  })
    .select("-refreshTokenHash -__v")
    .sort({ createdAt: -1 });
};

export {
  createSession,
  findActiveSessionByRefreshTokenHash,
  updateSessionRefreshToken,
  revokeSessionByRefreshTokenHash,
  revokeSessionById,
  getActiveSessionsByUser,
};
