import { z } from "zod";
import { USER_ROLES } from "../../common/constants/roles";

const permissionSchema = z.enum([
  "create_order",
  "view_orders",
  "delete_order",
  "manage_users",
  "manage_roles",
  "manage_company",
  "create_project",
  "view_project",
  "update_project",
  "delete_project",
  "create_analytics",
  "view_analytics",
  "view_reports",
  "create_activity",
  "view_activity",
  "delete_activity",
  "create_email",
  "view_email",
  "update_email",
  "create_notification",
  "view_notification",
  "update_notification",
  "delete_notification",
  "create_task",
  "view_task",
  "update_task",
  "delete_task",
  "assign_task",
  "create_bug",
  "view_bug",
  "update_bug",
  "delete_bug",
  "create_comment",
  "view_comment",
  "update_comment",
  "delete_comment",
  "upload_document",
  "view_document",
  "update_document",
  "delete_document",
  "view_audit_logs",
]);

const updatePermissionsSchema = z.object({
  role: z.enum(USER_ROLES),
  permissions: z.array(permissionSchema).min(1, "At least one permission is required"),
});

export { updatePermissionsSchema };
