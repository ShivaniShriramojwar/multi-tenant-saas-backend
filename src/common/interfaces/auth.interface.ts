import { Request } from "express";
type UserRole = "admin" | "manager" | "user";

// JWT payload
interface AuthTokenPayload {
  userId: string;
  tenantId: string;
  role: UserRole;
}

// Extend Express Request
interface AuthRequest extends Request {
  user?: AuthTokenPayload;
}

export { UserRole, AuthTokenPayload, AuthRequest };
