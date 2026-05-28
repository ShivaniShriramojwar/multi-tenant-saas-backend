import { z } from "zod";

const permissionSchema = z.enum([
  "create_order",
  "view_own_orders",
  "view_all_orders",
  "delete_order",
  "view_users",
  "create_user",
  "delete_user",
  "manage_roles",
  "view_audit_logs",
]);

const updatePermissionsSchema = z.object({
  role: z.enum(["admin", "manager", "user"]),
  permissions: z.array(permissionSchema).min(1, "At least one permission is required"),
});

export { updatePermissionsSchema };
