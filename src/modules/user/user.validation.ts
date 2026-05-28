import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "manager", "user"]),
});

const updateUserRoleSchema = z.object({
  role: z.enum(["admin", "manager", "user"]),
});

export { createUserSchema, updateUserRoleSchema };
