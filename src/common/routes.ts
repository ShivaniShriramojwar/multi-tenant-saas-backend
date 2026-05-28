import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes"; // ✅ FIXED
import userRoutes from "../modules/user/user.routes";
import orderRoutes from "../modules/order/order.routes";
import auditRoutes from "../modules/audit/audit.routes";
import permissionRoutes from "../modules/permission/permission.routes";

const rootRouter = Router();

rootRouter.use("/auth", authRoutes);
rootRouter.use("/users", userRoutes);
rootRouter.use("/orders", orderRoutes);
rootRouter.use("/audit-logs", auditRoutes);
rootRouter.use("/permissions", permissionRoutes);

export default rootRouter;
