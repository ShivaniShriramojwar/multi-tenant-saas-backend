import { DocumentCategory } from "../../common/constants/document-category";
import { EntityType } from "../../common/constants/entity-type";

interface UploadDocumentInput {
  name?: string;
  title?: string;
  description?: string;
  category: DocumentCategory;
  entityType?: EntityType;
  entityId?: string;
  projectId?: string;
  taskId?: string;
  bugId?: string;
  orderId?: string;
  tags?: string[];
}

interface UpdateDocumentInput {
  name?: string;
  title?: string;
  description?: string;
  category?: DocumentCategory;
  tags?: string[];
}

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

export { UploadDocumentInput, UpdateDocumentInput, DocumentListQuery };
