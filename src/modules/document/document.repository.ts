import { DocumentCategory } from "../../common/constants/document-category";
import { ENTITY_TYPE, EntityType } from "../../common/constants/entity-type";
import { ProjectDocument } from "./document.model";

interface DocumentListQuery {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  category?: DocumentCategory;
  entityType?: EntityType;
  entityId?: string;
  projectId?: string;
  taskId?: string;
  bugId?: string;
  orderId?: string;
  uploadedBy?: string;
  mimeType?: string;
}

const createDocument = async (data: any) => {
  return ProjectDocument.create(data);
};

const buildDocumentFilter = (tenantId: string, query: DocumentListQuery) => {
  const filter: any = { tenantId };

  if (query.category) {
    filter.category = query.category;
  }

  if (query.entityType) {
    filter.entityType = query.entityType;
  }

  if (query.entityId) {
    filter.entityId = query.entityId;
  }

  if (query.projectId) {
    filter.entityType = ENTITY_TYPE.PROJECT;
    filter.entityId = query.projectId;
  }

  if (query.taskId) {
    filter.entityType = ENTITY_TYPE.TASK;
    filter.entityId = query.taskId;
  }

  if (query.bugId) {
    filter.entityType = ENTITY_TYPE.BUG;
    filter.entityId = query.bugId;
  }

  if (query.orderId) {
    filter.entityType = ENTITY_TYPE.ORDER;
    filter.entityId = query.orderId;
  }

  if (query.uploadedBy) {
    filter.uploadedBy = query.uploadedBy;
  }

  if (query.mimeType) {
    filter.mimeType = query.mimeType;
  }

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { description: { $regex: query.search, $options: "i" } },
      { tags: { $regex: query.search, $options: "i" } },
      { originalName: { $regex: query.search, $options: "i" } },
    ];
  }

  return filter;
};

const getDocumentsByTenant = async (
  tenantId: string,
  query: DocumentListQuery,
) => {
  const filter = buildDocumentFilter(tenantId, query);

  const [documents, total] = await Promise.all([
    ProjectDocument.find(filter)
      .select("name originalName description url publicId mimeType size category entityType entityId tenantId uploadedBy tags createdAt updatedAt")
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .lean(),
    ProjectDocument.countDocuments(filter),
  ]);

  return {
    documents,
    total,
  };
};

const getDocumentById = async (documentId: string) => {
  return ProjectDocument.findById(documentId)
    .populate("uploadedBy", "name email");
};

const updateDocumentById = async (
  documentId: string,
  tenantId: string,
  data: any,
) => {
  return ProjectDocument.findOneAndUpdate(
    {
      _id: documentId,
      tenantId,
    },
    data,
    {
      new: true,
      runValidators: true,
    },
  ).populate("uploadedBy", "name email");
};

const deleteDocumentById = async (documentId: string) => {
  return ProjectDocument.findByIdAndDelete(documentId);
};

const deleteDocumentsByEntity = async (
  tenantId: string,
  entityType: EntityType,
  entityId: string,
) => {
  return ProjectDocument.deleteMany({
    tenantId,
    entityType,
    entityId,
  });
};

export {
  createDocument,
  getDocumentsByTenant,
  getDocumentById,
  updateDocumentById,
  deleteDocumentById,
  deleteDocumentsByEntity,
};
