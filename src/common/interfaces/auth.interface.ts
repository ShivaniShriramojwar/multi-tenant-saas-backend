import { Request } from "express";
import { UserRole } from "../constants/roles";

interface AuthTokenPayload {
  userId: string;
  tenantId: string;
  role: UserRole;
}

interface AuthRequest extends Request {
  user?: AuthTokenPayload;
}

export { AuthTokenPayload, AuthRequest };
