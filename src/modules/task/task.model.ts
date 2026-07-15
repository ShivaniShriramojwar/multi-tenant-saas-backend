import mongoose, { Schema, Document } from "mongoose";
import {
  TASK_STATUS,
  TASK_STATUSES,
  TaskStatus,
} from "../../common/constants/task-status";
import {
  PRIORITY,
  PRIORITIES,
  Priority,
} from "../../common/constants/priorities";

export interface ITask extends Document {
  title: string;
  description: string;

  projectId: mongoose.Types.ObjectId;

  assignedTo?: mongoose.Types.ObjectId;

  createdBy: mongoose.Types.ObjectId;

  tenantId: mongoose.Types.ObjectId;

  status: TaskStatus;

  priority: Priority;

  dueDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    status: {
      type: String,
      enum: TASK_STATUSES,
      default: TASK_STATUS.TODO,
    },

    priority: {
      type: String,
      enum: PRIORITIES,
      default: PRIORITY.MEDIUM,
    },

    dueDate: Date,
  },
  {
    timestamps: true,
  },
);

taskSchema.index({ tenantId: 1, createdAt: -1 });
taskSchema.index({ tenantId: 1, status: 1 });
taskSchema.index({ tenantId: 1, projectId: 1 });
taskSchema.index({ tenantId: 1, assignedTo: 1 });
taskSchema.index({
  title: "text",
  description: "text",
  status: "text",
  priority: "text",
});

export const Task = mongoose.model<ITask>("Task", taskSchema);
