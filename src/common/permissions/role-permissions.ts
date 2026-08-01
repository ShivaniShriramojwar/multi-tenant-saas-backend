import { ROLES, UserRole } from "../constants/roles";

/**
 * ==========================================================
 * Permission Types
 * ==========================================================
 */

export type Permission =
  // Company Management
  | "manage_company"
  | "manage_users"
  | "manage_roles"

  // Dashboard
  | "view_dashboard"

  // Activity
  | "create_activity"
  | "view_activity"
  | "delete_activity"

  // Analytics
  | "create_analytics"
  | "view_analytics"

  // Reports
  | "view_reports"

  // Email
  | "create_email"
  | "view_email"
  | "update_email"

  // Project
  | "create_project"
  | "view_project"
  | "update_project"
  | "delete_project"

  // Task
  | "create_task"
  | "view_task"
  | "update_task"
  | "delete_task"
  | "assign_task"

  // Bug
  | "create_bug"
  | "view_bug"
  | "update_bug"
  | "delete_bug"

  // Comments
  | "create_comment"
  | "view_comment"
  | "update_comment"
  | "delete_comment"

  // Notifications
  | "create_notification"
  | "view_notification"
  | "update_notification"
  | "delete_notification"

  // Documents
  | "upload_document"
  | "view_document"
  | "update_document"
  | "delete_document"

  // Orders
  | "create_order"
  | "view_orders"
  | "delete_order"

  // Audit Logs
  | "view_audit_logs";

/**
 * ==========================================================
 * Role Permissions
 * ==========================================================
 */

export const rolePermissions: Readonly<
  Record<UserRole, readonly Permission[]>
> = {
  /**
   * ======================================================
   * Super Admin
   * Full access across the platform
   * ======================================================
   */
  [ROLES.SUPER_ADMIN]: [
    // Company
    "manage_company",
    "manage_users",
    "manage_roles",

    // Dashboard
    "view_dashboard",

    // Activity
    "create_activity",
    "view_activity",
    "delete_activity",

    // Analytics
    "create_analytics",
    "view_analytics",

    // Reports
    "view_reports",

    // Email
    "create_email",
    "view_email",
    "update_email",

    // Projects
    "create_project",
    "view_project",
    "update_project",
    "delete_project",

    // Tasks
    "create_task",
    "view_task",
    "update_task",
    "delete_task",
    "assign_task",

    // Bugs
    "create_bug",
    "view_bug",
    "update_bug",
    "delete_bug",

    // Comments
    "create_comment",
    "view_comment",
    "update_comment",
    "delete_comment",

    // Notifications
    "create_notification",
    "view_notification",
    "update_notification",
    "delete_notification",

    // Documents
    "upload_document",
    "view_document",
    "update_document",
    "delete_document",

    // Orders
    "create_order",
    "view_orders",
    "delete_order",

    // Audit
    "view_audit_logs",
  ],

  /**
   * ======================================================
   * Head Product Manager
   * Manages product delivery and teams
   * ======================================================
   */
  [ROLES.HEAD_PRODUCT_MANAGER]: [
    // Projects
    "create_project",
    "view_project",
    "update_project",

    // Dashboard
    "view_dashboard",

    // Activity
    "create_activity",
    "view_activity",

    // Analytics
    "create_analytics",
    "view_analytics",

    // Reports
    "view_reports",

    // Email
    "create_email",
    "view_email",
    "update_email",

    // Tasks
    "create_task",
    "view_task",
    "update_task",
    "assign_task",

    // Bugs
    "create_bug",
    "view_bug",
    "update_bug",

    // Comments
    "create_comment",
    "view_comment",
    "update_comment",

    // Notifications
    "create_notification",
    "view_notification",
    "update_notification",

    // Documents
    "upload_document",
    "view_document",
    "update_document",
    "delete_document",

    // Orders
    "view_orders",
  ],

  /**
   * ======================================================
   * Team Lead
   * Manages developers & testers
   * ======================================================
   */
  [ROLES.TEAM_LEAD]: [
    // Projects
    "view_project",

    // Dashboard
    "view_dashboard",

    // Activity
    "view_activity",

    // Analytics
    "create_analytics",
    "view_analytics",

    // Reports
    "view_reports",

    // Email
    "view_email",

    // Tasks
    "create_task",
    "view_task",
    "update_task",
    "assign_task",

    // Bugs
    "create_bug",
    "view_bug",
    "update_bug",

    // Comments
    "create_comment",
    "view_comment",
    "update_comment",

    // Notifications
    "view_notification",
    "update_notification",

    // Documents
    "upload_document",
    "view_document",
    "update_document",
  ],

  /**
   * ======================================================
   * Developer
   * Works on assigned tasks & bugs
   * ======================================================
   */
  [ROLES.DEVELOPER]: [
    "view_project",
    // Dashboard
    "view_dashboard",

    // Activity
    "view_activity",

    // Analytics
    "create_analytics",
    "view_analytics",

    // Email
    "view_email",

    "view_task",
    "update_task",

    "view_bug",
    "update_bug",

    "create_comment",
    "view_comment",
    "update_comment",

    // Notifications
    "view_notification",
    "update_notification",

    // Documents
    "upload_document",
    "view_document",
    "update_document",
  ],

  /**
   * ======================================================
   * Tester
   * Tests features and reports bugs
   * ======================================================
   */
  [ROLES.TESTER]: [
    "view_project",
    // Dashboard
    "view_dashboard",

    // Activity
    "view_activity",

    // Analytics
    "create_analytics",
    "view_analytics",

    // Email
    "view_email",

    "view_task",

    "create_bug",
    "view_bug",
    "update_bug",

    "create_comment",
    "view_comment",
    "update_comment",

    // Notifications
    "view_notification",
    "update_notification",

    // Documents
    "upload_document",
    "view_document",
    "update_document",
  ],
};

/**
 * ==========================================================
 * Permission Helpers
 * ==========================================================
 */

export const hasPermission = (
  role: UserRole,
  permission: Permission,
): boolean => {
  return rolePermissions[role]?.includes(permission) ?? false;
};

export const getRolePermissions = (): Readonly<
  Record<UserRole, readonly Permission[]>
> => rolePermissions;

export const getPermissionsForRole = (
  role: UserRole,
): readonly Permission[] => {
  return rolePermissions[role] ?? [];
};
