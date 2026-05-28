import { z } from "zod";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  tenantName: z.string().trim().min(1, "Tenant name is required"),
  role: z.enum(["admin", "manager", "user"]),
});

export { registerSchema };
