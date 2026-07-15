import { z } from "zod";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY,
} from "../../common/constants/document-category";
import { ENTITY_TYPES } from "../../common/constants/entity-type";
import {
  idParamSchema,
  optionalObjectIdSchema,
} from "../../common/middleware/validate.middleware";

const normalizeTags = (value: unknown) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return undefined;
};

const uploadDocumentSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
    title: z.string().trim().min(2, "Title must be at least 2 characters").optional(),
    description: z.string().trim().optional(),
    category: z.enum(DOCUMENT_CATEGORIES).default(DOCUMENT_CATEGORY.OTHER),
    entityType: z.enum(ENTITY_TYPES).optional(),
    entityId: optionalObjectIdSchema,
    projectId: optionalObjectIdSchema,
    taskId: optionalObjectIdSchema,
    bugId: optionalObjectIdSchema,
    orderId: optionalObjectIdSchema,
    tags: z.preprocess(
      normalizeTags,
      z.array(z.string().trim().min(1)).max(20).optional(),
    ),
  })
  .refine((data) => {
    return (
      (data.entityType && data.entityId) ||
      data.projectId ||
      data.taskId ||
      data.bugId ||
      data.orderId
    );
  }, {
    message: "Entity type and entity ID are required",
    path: ["entityId"],
  });

const updateDocumentSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
    title: z.string().trim().min(2, "Title must be at least 2 characters").optional(),
    description: z.string().trim().optional(),
    category: z.enum(DOCUMENT_CATEGORIES).optional(),
    tags: z.preprocess(
      normalizeTags,
      z.array(z.string().trim().min(1)).max(20).optional(),
    ),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one document detail is required",
  });
const getDocumentsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  category: z.enum(DOCUMENT_CATEGORIES).optional(),
  entityType: z.enum(ENTITY_TYPES).optional(),
  entityId: optionalObjectIdSchema,
  projectId: optionalObjectIdSchema,
  taskId: optionalObjectIdSchema,
  bugId: optionalObjectIdSchema,
  orderId: optionalObjectIdSchema,
  uploadedBy: optionalObjectIdSchema,
  mimeType: z.string().trim().min(1).optional(),
});
const documentIdSchema = idParamSchema;

export {
  uploadDocumentSchema,
  getDocumentsQuerySchema,
  documentIdSchema,
  updateDocumentSchema,
};
