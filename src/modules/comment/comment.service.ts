import { AppError } from "../../common/errors/app-error";
import { AUDIT_ACTION } from "../../common/constants/audit-actions";
import { ENTITY_TYPE, EntityType } from "../../common/constants/entity-type";
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

import { emitTenantNotification } from "../../infrastructure/socket/socket";
import { deleteFromS3, uploadToS3 } from "../../infrastructure/storage/s3";

import { createAuditLog } from "../audit/audit.service";

import { getProjectByIdAndTenant } from "../project/project.repository";
import { getTaskById } from "../task/task.repository";
import { getBugById } from "../bug/bug.repository";
import { getOrderById } from "../order/order.repository";
import { DOCUMENT_CATEGORY } from "../../common/constants/document-category";
import {
  createDocument,
  deleteDocumentsByEntity,
} from "../document/document.repository";

import {
  createComment,
  getComments,
  getCommentById,
  updateCommentById,
  deleteCommentById,
} from "./comment.repository";

import {
  CreateCommentInput,
  UpdateCommentInput,
  CommentListQuery,
} from "./comment.types";
import { AUDIT_TARGET } from "../../common/constants/audit-targets";

const createHttpError = (message: string, statusCode = 400) => {
  return new AppError(message, statusCode);
};

const validateCommentTarget = async (
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

    default:
      throw createHttpError("Invalid entity type");
  }
};

const validateMentionedUsers = async (
  mentions: string[] | undefined,
  tenantId: string,
) => {
  if (!mentions?.length) {
    return;
  }

  await Promise.all(
    mentions.map(async (userId) => {
      await validateUserBelongsToTenant(userId, tenantId, "Mentioned user");
    }),
  );
};

const createCommentService = async (
  data: CreateCommentInput,
  tenantId: string,
  actorUserId: string,
  files: Express.Multer.File[] = [],
) => {
  await validateCommentTarget(data.entityType, data.entityId, tenantId);
  await validateMentionedUsers(data.mentions, tenantId);

  if (data.parentComment) {
    const parent = await getCommentById(data.parentComment);

    const parentComment = assertSameTenant(
      parent,
      tenantId,
      "Parent comment",
    );

    if (
      parentComment.entityType !== data.entityType ||
      getObjectIdString(parentComment.entityId) !== data.entityId
    ) {
      throw createHttpError("Parent comment must belong to the same entity");
    }
  }

  const attachments = await Promise.all(
    files.map(async (file, index) => {
      const folder = `backend-saas/${tenantId}/comment-attachments/${data.entityType.toLowerCase()}/${data.entityId}`;
      const { extension } = validateUploadFile(file, FILE_UPLOAD_RULES.attachment);
      const key = createS3ObjectKey(
        folder,
        `${data.entityId}-${index}`,
        file.originalname,
      );
      const uploaded = await uploadToS3({
        buffer: file.buffer,
        key,
        contentType: file.mimetype,
      });

      return {
        url: uploaded.url,
        publicId: uploaded.key,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        extension,
        resourceType: "s3",
        folder,
        uploadedAt: new Date(),
      };
    }),
  );

  const comment = await createComment({
    ...data,
    tenantId,
    createdBy: actorUserId,
    attachments,
  });

  await Promise.all(
    attachments.map((attachment) =>
      createDocument({
        name: attachment.originalName,
        originalName: attachment.originalName,
        url: attachment.url,
        publicId: attachment.publicId,
        resourceType: attachment.resourceType,
        mimeType: attachment.mimeType,
        extension: attachment.extension,
        size: attachment.size,
        category: DOCUMENT_CATEGORY.OTHER,
        tags: ["comment", "attachment"],
        tenantId,
        entityType: ENTITY_TYPE.COMMENT,
        entityId: comment._id.toString(),
        uploadedBy: actorUserId,
        folder: attachment.folder,
      }),
    ),
  );

  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.COMMENT_CREATED,
    targetType: AUDIT_TARGET.COMMENT,
    targetId: comment._id.toString(),
    details: {
      entityType: comment.entityType,
      entityId: comment.entityId.toString(),
      attachmentsCount: attachments.length,
    },
  });

  emitTenantNotification(tenantId, {
    type: "comment.created",
    message: "A new comment was added",
    data: {
      commentId: comment._id.toString(),
      entityType: comment.entityType,
      entityId: comment.entityId.toString(),
      attachmentsCount: attachments.length,
    },
  });

  return comment;
};

const getCommentsService = async (
  tenantId: string,
  query: CommentListQuery,
) => {
  if (query.entityId && !query.entityType) {
    throw createHttpError("Entity type is required when filtering by entity ID");
  }

  if (query.entityType && query.entityId) {
    await validateCommentTarget(query.entityType, query.entityId, tenantId);
  }

  if (query.createdBy) {
    await validateUserBelongsToTenant(query.createdBy, tenantId, "Comment author");
  }

  const result = await getComments(tenantId, query);

  return buildPaginationResponse(result.comments, query, result.total);
};
const getCommentByIdService = async (commentId: string, tenantId: string) => {
  const comment = await getCommentById(commentId);

  return assertSameTenant(comment, tenantId, "Comment");
};
const updateCommentService = async (
  commentId: string,
  data: UpdateCommentInput,
  tenantId: string,
  actorUserId: string,
) => {
  const existingComment = assertSameTenant(
    await getCommentById(commentId),
    tenantId,
    "Comment",
  );

  await validateMentionedUsers(data.mentions, tenantId);

  const comment = await updateCommentById(commentId, tenantId, data);

  if (!comment) {
    throw createNotFoundError("Comment");
  }

  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.COMMENT_UPDATED,
    targetType: AUDIT_TARGET.COMMENT,
    targetId: comment._id.toString(),
    details: {
      previousContent: existingComment.content,
      updatedContent: comment.content,
    },
  });

  emitTenantNotification(tenantId, {
    type: "comment.updated",
    message: "Comment updated successfully",
    data: {
      commentId: comment._id.toString(),
    },
  });

  return comment;
};
const deleteCommentService = async (
  commentId: string,
  tenantId: string,
  actorUserId: string,
) => {
  const comment = assertSameTenant(
    await getCommentById(commentId),
    tenantId,
    "Comment",
  );

  await Promise.all(
    (comment.attachments || []).map((attachment) =>
      deleteFromS3({ key: attachment.publicId }),
    ),
  );

  await deleteDocumentsByEntity(
    tenantId,
    ENTITY_TYPE.COMMENT,
    comment._id.toString(),
  );

  await deleteCommentById(commentId);

  await createAuditLog({
    tenantId,
    actorUserId,
    action: AUDIT_ACTION.COMMENT_DELETED,
    targetType: AUDIT_TARGET.COMMENT,
    targetId: comment._id.toString(),
    details: {
      entityType: comment.entityType,
      entityId: comment.entityId.toString(),
      attachmentsCount: comment.attachments?.length || 0,
    },
  });

  emitTenantNotification(tenantId, {
    type: "comment.deleted",
    message: "A comment was deleted",
    data: {
      commentId: comment._id.toString(),
    },
  });

  return {
    id: comment._id.toString(),
  };
};
export {
  createCommentService,
  getCommentsService,
  getCommentByIdService,
  updateCommentService,
  deleteCommentService,
};
