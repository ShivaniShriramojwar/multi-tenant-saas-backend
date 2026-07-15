import { z } from "zod";

const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");

const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),

    email: z.string().trim().email("Invalid email address").toLowerCase(),

    password: passwordSchema,

    tenantName: z.string().trim().min(1, "Tenant name is required"),
  })
  .strict();

export { registerSchema };
