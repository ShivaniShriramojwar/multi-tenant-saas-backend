import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes"; // ✅ FIXED
import userRoutes from "../modules/user/user.routes";
import orderRoutes from "../modules/order/order.routes";
import auditRoutes from "../modules/audit/audit.routes";
import permissionRoutes from "../modules/permission/permission.routes";
import projectRoutes from "../modules/project/project.routes";
import taskRoutes from "../modules/task/task.routes";
import bugRoutes from "../modules/bug/bug.routes";
import commentRoutes from "../modules/comment/comment.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import documentRoutes from "../modules/document/document.routes";
import notificationRoutes from "../modules/notification/notification.routes";
import activityRoutes from "../modules/activity/activity.routes";
import analyticsRoutes from "../modules/analytics/analytics.routes";
import emailRoutes from "../modules/email/email.routes";
import searchRoutes from "../modules/search/search.routes";
import reportRoutes from "../modules/report/report.routes";
const rootRouter = Router();

rootRouter.use("/auth", authRoutes);
rootRouter.use("/users", userRoutes);
rootRouter.use("/orders", orderRoutes);
rootRouter.use("/audit-logs", auditRoutes);
rootRouter.use("/permissions", permissionRoutes);
rootRouter.use("/projects", projectRoutes);
rootRouter.use("/tasks", taskRoutes);
rootRouter.use("/bugs", bugRoutes);
rootRouter.use("/comments", commentRoutes);
rootRouter.use("/dashboard", dashboardRoutes);
rootRouter.use("/documents", documentRoutes);
rootRouter.use("/notifications", notificationRoutes);
rootRouter.use("/activities", activityRoutes);
rootRouter.use("/analytics", analyticsRoutes);
rootRouter.use("/emails", emailRoutes);
rootRouter.use("/search", searchRoutes);
rootRouter.use("/reports", reportRoutes);

export default rootRouter;
