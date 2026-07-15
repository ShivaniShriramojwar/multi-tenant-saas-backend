import { Router } from "express";

import {
  authorizePermission,
  verifyToken,
} from "../../common/middleware/auth.middleware";
import { writeLimiter } from "../../common/middleware/rate-limit.middleware";
import { validate } from "../../common/middleware/validate.middleware";

import {
  getEmailLogByIdController,
  getEmailLogsController,
  getEmailSummaryController,
  retryEmailController,
  sendEmailController,
} from "./email.controller";
import {
  emailLogIdSchema,
  emailLogListQuerySchema,
  emailSummaryQuerySchema,
  sendEmailSchema,
} from "./email.validation";

const router = Router();

router.post(
  "/",
  writeLimiter,
  verifyToken,
  authorizePermission("create_email"),
  validate({ body: sendEmailSchema }),
  sendEmailController,
);

router.get(
  "/",
  verifyToken,
  authorizePermission("view_email"),
  validate({ query: emailLogListQuerySchema }),
  getEmailLogsController,
);

router.get(
  "/summary",
  verifyToken,
  authorizePermission("view_email"),
  validate({ query: emailSummaryQuerySchema }),
  getEmailSummaryController,
);

router.get(
  "/:id",
  verifyToken,
  authorizePermission("view_email"),
  validate({ params: emailLogIdSchema }),
  getEmailLogByIdController,
);

router.patch(
  "/:id/retry",
  writeLimiter,
  verifyToken,
  authorizePermission("update_email"),
  validate({ params: emailLogIdSchema }),
  retryEmailController,
);

export default router;
