import mongoose, { Schema } from "mongoose";

import { IUser } from "./user.types";
import { USER_ROLES, ROLES } from "../../common/constants/roles";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    role: {
      type: String,
      enum: USER_ROLES,
      default: ROLES.DEVELOPER,
    },

    profileImage: {
      url: String,
      publicId: String,
      uploadedAt: Date,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
    },

    lockedUntil: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ tenantId: 1, createdAt: -1 });
userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ name: "text", email: "text", role: "text" });

const User = mongoose.model<IUser>("User", userSchema);

export { User };
