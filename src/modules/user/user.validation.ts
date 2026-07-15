import { z } from "zod";
import { USER_ROLES } from "../../common/constants/roles";
import { idParamSchema } from "../../common/middleware/validate.middleware";

const userRoleSchema = z.enum(USER_ROLES);
const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: passwordSchema,
  role: userRoleSchema,
});

const updateUserRoleSchema = z.object({
  role: userRoleSchema,
});
const getUsersQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  role: userRoleSchema.optional(),
});
const userIdSchema = idParamSchema;

export {
  createUserSchema,
  getUsersQuerySchema,
  userIdSchema,
  updateUserRoleSchema,
};
