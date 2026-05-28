import { Router } from "express";
import registerRoutes from "./register/register.routes";
import loginRoutes from "./login/login.routes";
import sessionRoutes from "./session/session.routes";
import { authLimiter } from "../../common/middleware/rate-limit.middleware";

const router = Router();

console.log("Auth router initialized");

// 🔥 Mount feature routes
router.use("/register", authLimiter, registerRoutes);
router.use("/login", authLimiter, loginRoutes);
router.use("/", sessionRoutes);

export default router;
