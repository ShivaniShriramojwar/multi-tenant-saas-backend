import mongoose, { Schema, Document } from "mongoose";
import {
  PROJECT_STATUS,
  PROJECT_STATUSES,
  ProjectStatus,
} from "../../common/constants/project-status";

export interface IProject extends Document {
  name: string;
  description: string;

  tenantId: mongoose.Types.ObjectId;

  createdBy: mongoose.Types.ObjectId;

  status: ProjectStatus;

  startDate?: Date;
  endDate?: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: PROJECT_STATUS.ACTIVE,
    },

    startDate: Date,

    endDate: Date,
  },
  {
    timestamps: true,
  },
);

projectSchema.index({ tenantId: 1, createdAt: -1 });
projectSchema.index({ tenantId: 1, status: 1 });
projectSchema.index({ name: "text", description: "text", status: "text" });

export const Project = mongoose.model<IProject>("Project", projectSchema);
