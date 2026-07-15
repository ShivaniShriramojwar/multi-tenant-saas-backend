import { Router } from "express";

import {
  verifyToken,
  authorizePermission,
} from "../../common/middleware/auth.middleware";
import { writeLimiter } from "../../common/middleware/rate-limit.middleware";
import { attachmentUpload } from "../../common/middleware/upload.middleware";
import { validate } from "../../common/middleware/validate.middleware";

import {
  createCommentController,
  getCommentsController,
  getCommentByIdController,
  updateCommentController,
  deleteCommentController,
} from "./comment.controller";
import {
  commentIdSchema,
  createCommentSchema,
  getCommentsQuerySchema,
  updateCommentSchema,
} from "./comment.validation";

const router = Router();

router.post(
  "/",
  writeLimiter,
  verifyToken,
  authorizePermission("create_comment"),
  attachmentUpload.array("attachments", 5),
  validate({ body: createCommentSchema }),
  createCommentController,
);

router.get(
  "/",
  verifyToken,
  authorizePermission("view_comment"),
  validate({ query: getCommentsQuerySchema }),
  getCommentsController,
);

router.get(
  "/:id",
  verifyToken,
  authorizePermission("view_comment"),
  validate({ params: commentIdSchema }),
  getCommentByIdController,
);

router.put(
  "/:id",
  writeLimiter,
  verifyToken,
  authorizePermission("update_comment"),
  validate({ params: commentIdSchema, body: updateCommentSchema }),
  updateCommentController,
);

router.delete(
  "/:id",
  writeLimiter,
  verifyToken,
  authorizePermission("delete_comment"),
  validate({ params: commentIdSchema }),
  deleteCommentController,
);

export default router;
