import crypto from "crypto";

const REFRESH_TOKEN_TTL_DAYS = 7;

const createRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

const hashRefreshToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const getRefreshTokenExpiry = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return expiresAt;
};

export { createRefreshToken, hashRefreshToken, getRefreshTokenExpiry };
