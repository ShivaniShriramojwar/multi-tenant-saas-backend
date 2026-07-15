import { Router } from "express";
import {
  authorizePermission,
  verifyToken,
} from "../../common/middleware/auth.middleware";
import { writeLimiter } from "../../common/middleware/rate-limit.middleware";
import { documentUpload } from "../../common/middleware/upload.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import {
  deleteDocumentController,
  getDocumentByIdController,
  getDocumentDownloadUrlController,
  getDocumentsController,
  updateDocumentController,
  uploadDocumentsController,
} from "./document.controller";
import {
  documentIdSchema,
  getDocumentsQuerySchema,
  updateDocumentSchema,
  uploadDocumentSchema,
} from "./document.validation";

const router = Router();

router.post(
  "/",
  writeLimiter,
  verifyToken,
  authorizePermission("upload_document"),
  documentUpload.array("documents", 10),
  validate({ body: uploadDocumentSchema }),
  uploadDocumentsController,
);

router.get(
  "/",
  verifyToken,
  authorizePermission("view_document"),
  validate({ query: getDocumentsQuerySchema }),
  getDocumentsController,
);

router.get(
  "/:id/download-url",
  verifyToken,
  authorizePermission("view_document"),
  validate({ params: documentIdSchema }),
  getDocumentDownloadUrlController,
);

router.get(
  "/:id/download",
  verifyToken,
  authorizePermission("view_document"),
  validate({ params: documentIdSchema }),
  getDocumentDownloadUrlController,
);

router.get(
  "/:id",
  verifyToken,
  authorizePermission("view_document"),
  validate({ params: documentIdSchema }),
  getDocumentByIdController,
);

router.put(
  "/:id",
  writeLimiter,
  verifyToken,
  authorizePermission("update_document"),
  validate({ params: documentIdSchema, body: updateDocumentSchema }),
  updateDocumentController,
);

router.delete(
  "/:id",
  writeLimiter,
  verifyToken,
  authorizePermission("delete_document"),
  validate({ params: documentIdSchema }),
  deleteDocumentController,
);

export default router;
