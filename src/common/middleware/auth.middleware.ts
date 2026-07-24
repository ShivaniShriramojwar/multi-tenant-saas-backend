import { Response, NextFunction } from "express";
import { AuthRequest } from "../interfaces/auth.interface";
import { hasPermission, Permission } from "../permissions/role-permissions";
import { verifyJwtToken } from "../utils/jwt.util";
import { UserRole } from "../constants/roles";

const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyJwtToken(token);

    // attach user
    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const authorizeRoles = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};

const authorizePermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        message: `Permission denied: ${permission}`,
      });
    }

    next();
  };
};

export { verifyToken, authorizeRoles, authorizePermission };
