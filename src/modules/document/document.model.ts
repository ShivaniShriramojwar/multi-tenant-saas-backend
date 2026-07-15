import mongoose, { Document, Schema } from "mongoose";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY,
  DocumentCategory,
} from "../../common/constants/document-category";
import {
  ENTITY_TYPES,
  EntityType,
} from "../../common/constants/entity-type";

export interface IDocument extends Document {
  name: string;
  originalName: string;
  url: string;
  publicId: string;
  resourceType: string;
  mimeType: string;
  extension: string;
  size: number;
  tenantId: mongoose.Types.ObjectId;
  entityType: EntityType;
  entityId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  description?: string;
  folder: string;
  category: DocumentCategory;
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },

    resourceType: {
      type: String,
      required: true,
    },

    mimeType: {
      type: String,
      required: true,
      index: true,
    },

    extension: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    size: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      enum: DOCUMENT_CATEGORIES,
      default: DOCUMENT_CATEGORY.OTHER,
      index: true,
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    entityType: {
      type: String,
      enum: ENTITY_TYPES,
      required: true,
      index: true,
    },

    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    folder: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

documentSchema.index({ tenantId: 1, entityType: 1, entityId: 1, createdAt: -1 });
documentSchema.index({ tenantId: 1, category: 1, createdAt: -1 });
documentSchema.index({ tenantId: 1, createdAt: -1 });
documentSchema.index({ tenantId: 1, uploadedBy: 1 });
documentSchema.index({
  name: "text",
  originalName: "text",
  description: "text",
  tags: "text",
});

const ProjectDocument = mongoose.model<IDocument>(
  "Document",
  documentSchema,
);

export { ProjectDocument };
