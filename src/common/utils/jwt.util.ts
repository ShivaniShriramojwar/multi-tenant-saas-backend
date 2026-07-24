import jwt from "jsonwebtoken";
import { AuthTokenPayload } from "../interfaces/auth.interface";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const generateToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
};

const verifyJwtToken = (token: string): AuthTokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    throw new Error("Invalid or expired token");
  }
};

export { generateToken, verifyJwtToken };
