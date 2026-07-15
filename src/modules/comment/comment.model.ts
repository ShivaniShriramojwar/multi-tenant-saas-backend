import mongoose, { Document, Schema } from "mongoose";
import {
  ENTITY_TYPE,
  ENTITY_TYPES,
  EntityType,
} from "../../common/constants/entity-type";

interface CommentDocument extends Document {
  content: string;

  tenantId: mongoose.Types.ObjectId;

  createdBy: mongoose.Types.ObjectId;

  entityType: EntityType;

  entityId: mongoose.Types.ObjectId;

  parentComment?: mongoose.Types.ObjectId;

  mentions?: mongoose.Types.ObjectId[];

  attachments?: Array<{
    url: string;
    publicId: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: Date;
  }>;

  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<CommentDocument>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },

    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    entityType: {
      type: String,
      enum: ENTITY_TYPES,
      required: true,
    },

    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },

    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    attachments: [
      {
        url: String,
        publicId: String,
        originalName: String,
        mimeType: String,
        size: Number,
        uploadedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Fast lookup for comments of an entity
commentSchema.index({
  tenantId: 1,
  entityType: 1,
  entityId: 1,
});

// Fast lookup for replies
commentSchema.index({
  parentComment: 1,
});

// Recent comments
commentSchema.index({
  tenantId: 1,
  createdAt: -1,
});
commentSchema.index({ content: "text", entityType: "text" });

const Comment = mongoose.model<CommentDocument>("Comment", commentSchema);

export { Comment, CommentDocument };
