import { AppError, BadRequestError } from "../../common/errors/app-error";
import { getObjectIdString } from "../../common/utils/object-id.util";
import {
  assertSameTenant,
  buildPaginationResponse,
  createNotFoundError,
} from "../../common/utils/service.util";
import { validateUserBelongsToTenant } from "../user/user-tenant.util";
import {
  createS3ObjectKey,
  FILE_UPLOAD_RULES,
  validateUploadFile,
} from "../../common/utils/file-security.util";
import { AUDIT_ACTION } from "../../common/constants/audit-actions";
import { AUDIT_TARGET } from "../../common/constants/audit-targets";
import { ENTITY_TYPE, EntityType } from "../../common/constants/entity-type";
import {
  deleteFromS3,
  getS3SignedDownloadUrl,
  uploadToS3,
} from "../../infrastructure/storage/s3";
import { emitTenantNotification } from "../../infrastructure/socket/socket";
import { createAuditLog } from "../audit/audit.service";
import { getBugById } from "../bug/bug.repository";
import { getCommentById } from "../comment/comment.repository";
import { getOrderById } from "../order/order.repository";
import { getProjectByIdAndTenant } from "../project/project.repository";
import { getTaskById } from "../task/task.repository";
import {
  createDocument,
  deleteDocumentById,
  getDocumentById,
  getDocumentsByTenant,
  updateDocumentById,
} from "./document.repository";
import {
  DocumentListQuery,
  UpdateDocumentInput,
  UploadDocumentInput,
} from "./document.types";

const createHttpError = (message: string, statusCode = 400) => {
  return new AppError(message, statusCode);
};

const resolveDocumentTarget = (data: UploadDocumentInput) => {
  const targets: Array<{ entityType: EntityType; entityId: string }> = [];

  if (data.entityType && data.entityId) {
    targets.push({ entityType: data.entityType, entityId: data.entityId });
  }

  if (data.projectId) {
    targets.push({ entityType: ENTITY_TYPE.PROJECT, entityId: data.projectId });
  }

  if (data.taskId) {
    targets.push({ entityType: ENTITY_TYPE.TASK, entityId: data.taskId });
  }

  if (data.bugId) {
    targets.push({ entityType: ENTITY_TYPE.BUG, entityId: data.bugId });
  }

  if (data.orderId) {
    targets.push({ entityType: ENTITY_TYPE.ORDER, entityId: data.orderId });
  }

  if (targets.length !== 1) {
    throw createHttpError("Upload document to exactly one entity");
  }

  return targets[0];
};

const resolveDocumentListTarget = (query: DocumentListQuery) => {
  const targets: Array<{ entityType: EntityType; entityId: string }> = [];

  if (query.entityId && !query.entityType) {
    throw createHttpError("Entity type is required when filtering by entity ID");
  }

  if (query.entityType && query.entityId) {
    targets.push({ entityType: query.entityType, entityId: query.entityId });
  }

  if (query.projectId) {
    targets.push({ entityType: ENTITY_TYPE.PROJECT, entityId: query.projectId });
  }

  if (query.taskId) {
    targets.push({ entityType: ENTITY_TYPE.TASK, entityId: query.taskId });
  }

  if (query.bugId) {
    targets.push({ entityType: ENTITY_TYPE.BUG, entityId: query.bugId });
  }

  if (query.orderId) {
    targets.push({ entityType: ENTITY_TYPE.ORDER, entityId: query.orderId });
  }

  if (targets.length > 1) {
    throw createHttpError("Filter documents by only one entity");
  }

  return targets[0];
};

const validateDocumentTarget = async (
  entityType: EntityType,
  entityId: string,
  tenantId: string,
) => {
  switch (entityType) {
    case ENTITY_TYPE.PROJECT: {
      const project = await getProjectByIdAndTenant(entityId, tenantId);

      if (!project) {
        throw createNotFoundError("Project");
      }

      return;
    }

    case ENTITY_TYPE.TASK: {
      const task = await getTaskById(entityId);

      assertSameTenant(task, tenantId, "Task");

      return;
    }

    case ENTITY_TYPE.BUG: {
      const bug = await getBugById(entityId);

      assertSameTenant(bug, tenantId, "Bug");

      return;
    }

    case ENTITY_TYPE.ORDER: {
      const order = await getOrderById(entityId);

      assertSameTenant(order, tenantId, "Order");

      return;
    }

    case ENTITY_TYPE.COMMENT: {
      const comment = await getCommentById(entityId);

      assertSameTenant(comment, tenantId, "Comment");

      return;
    }

    default: {
      throw createHttpError("Invalid document entity type");
    }
  }
};

const uploadDocumentsService = async (
  data: UploadDocumentInput,
  tenantId: string,
  actorUserId: string,
  files: Express.Multer.File[],
) => {
  const target = resolveDocumentTarget(data);

  await validateDocumentTarget(target.entityType, target.entityId, tenantId);

  const documents = await Promise.all(
    files.map(async (file, index) => {
      const targetFolder = target.entityType.toLowerCase();
      const folder = `backend-saas/${tenantId}/documents/${targetFolder}/${target.entityId}`;
      const { extension } = validateUploadFile(file, FILE_UPLOAD_RULES.document);
      const key = createS3ObjectKey(
        folder,
        `${target.entityId}-${index}`,
        file.originalname,
      );

      const uploaded = await uploadToS3({
        buffer: file.buffer,
        key,
        contentType: file.mimetype,
      });

      const document = await createDocument({
        name: data.name || data.title || file.originalname,
        originalName: file.originalname,
        url: uploaded.url,
        publicId: uploaded.key,
        resourceType: "s3",
        mimeType: file.mimetype,
        extension,
        size: file.size,
        description: data.description,
        category: data.category,
        tags: data.tags || [],
        tenantId,
        entityType: target.entityType,
        entityId: target.entityId,
        uploadedBy: actorUserId,
        folder,
      });

      await createAuditLog({
        tenantId,
        actorUserId,
        action: AUDIT_ACTION.DOCUMENT_UPLOADED,
        targetType: AUDIT_TARGET.DOCUMENT,
        targetId: document._id.toString(),
        details: {
          name: document.name,
          category: document.category,
          entityType: document.entityType,
          entityId: document.entityId.toString(),
          originalName: document.originalName,
        },
      });

      return document;
    }),
  );

  emitTenantNotification(tenantId, {
    type: "document.uploaded",
    message: "New document uploaded",
    data: {
      entityType: target.entityType,
      entityId: target.entityId,
      count: documents.length,
      category: data.category,
    },
  });

  return documents;
};

const getDocumentsService = async (
  tenantId: string,
  query: DocumentListQuery,
) => {
  const target = resolveDocumentListTarget(query);

  if (target) {
    await validateDocumentTarget(target.entityType, target.entityId, tenantId);
  }

  if (query.uploadedBy) {
    await validateUserBelongsToTenant(query.uploadedBy, tenantId, "Uploaded user");
  }

  const result = await getDocumentsByTenant(tenantId, query);

  return buildPaginationResponse(result.documents, query, result.total);
};

const getDocumentByIdService = async (documentId: string, tenantId: string) => {
  const document = await getDocumentById(documentId);

  return assertSameTenant(document, tenantId, "Document");
};

const getDocumentDownloadUrlService = async (
  documentId: string,
  tenantId: string,
) => {
  const document = await getDocumentByIdService(documentId, tenantId);
  const expiresIn = Number(process.env.AWS_S3_SIGNED_URL_EXPIRES_IN || 300);

  if (document.resourceType !== "s3") {
    throw new BadRequestError("Signed download URL is only available for S3 documents");
  }

  const downloadUrl = await getS3SignedDownloadUrl({
    key: document.publicId,
    filename: document.originalName,
    expiresIn,
  });

  return {
    downloadUrl,
    expiresIn,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  };
};

const updateDocumentService = async (
  documentId: string,
  data: UpdateDocumentInput,
  tenantId: string,
  actorUserId: string,
) => {
  const existingDocument = assertSameTenant(
    await getDocumentById(documentId),
    tenantId,
    "Document",
  );

  const updateData: UpdateDocumentInput = {
    ...data,
  };

  if (data.name || data.title) {
    updateData.name = data.name || data.title;
  }

  delete updateData.title;

  const document = await updateDocumentById(documentId, tenantId, updateData);

  if (!document) {
    throw createNotFoundError("Document");
  }

  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.DOCUMENT_UPDATED,
    targetType: AUDIT_TARGET.DOCUMENT,
    targetId: document._id.toString(),
    details: {
      previous: {
        name: existingDocument.name,
        description: existingDocument.description,
        category: existingDocument.category,
        tags: existingDocument.tags,
      },
      updated: {
        name: document.name,
        description: document.description,
        category: document.category,
        tags: document.tags,
      },
    },
  });

  emitTenantNotification(tenantId, {
    type: "document.updated",
    message: "Document updated successfully",
    data: {
      documentId: document._id.toString(),
      entityType: document.entityType,
      entityId: getObjectIdString(document.entityId),
    },
  });

  return document;
};

const deleteDocumentService = async (
  documentId: string,
  tenantId: string,
  actorUserId: string,
) => {
  const document = assertSameTenant(
    await getDocumentById(documentId),
    tenantId,
    "Document",
  );

  await deleteFromS3({ key: document.publicId });

  await deleteDocumentById(documentId);

  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.DOCUMENT_DELETED,
    targetType: AUDIT_TARGET.DOCUMENT,
    targetId: document._id.toString(),
    details: {
      name: document.name,
      category: document.category,
      entityType: document.entityType,
      entityId: getObjectIdString(document.entityId),
      originalName: document.originalName,
    },
  });

  emitTenantNotification(tenantId, {
    type: "document.deleted",
    message: "A document was deleted",
    data: {
      documentId: document._id.toString(),
      entityType: document.entityType,
      entityId: getObjectIdString(document.entityId),
    },
  });

  return {
    id: document._id.toString(),
    name: document.name,
  };
};

export {
  uploadDocumentsService,
  getDocumentsService,
  getDocumentByIdService,
  getDocumentDownloadUrlService,
  updateDocumentService,
  deleteDocumentService,
};
