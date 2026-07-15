import mongoose from "mongoose";
import { UserRole } from "../../common/constants/roles";

export interface ProfileImage {
  url: string;
  publicId: string;
  uploadedAt: Date;
}

export interface IUser {
  name: string;
  email: string;
  password: string;

  tenantId: mongoose.Types.ObjectId;

  role: UserRole;

  profileImage?: ProfileImage;
  failedLoginAttempts?: number;
  lockedUntil?: Date;

  createdAt: Date;
  updatedAt: Date;
}
