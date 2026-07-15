export const AUDIT_ACTION = {
  // User
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  USER_ROLE_CHANGED: "user.role_changed",
  USER_PROFILE_UPDATED: "user.profile_updated",

  // Authentication
  USER_LOGIN: "user.login",
  USER_LOGOUT: "user.logout",
  USER_REGISTERED: "user.registered",

  // Permissions
  PERMISSION_UPDATED: "permission.updated",

  // Projects
  PROJECT_CREATED: "project.created",
  PROJECT_UPDATED: "project.updated",
  PROJECT_DELETED: "project.deleted",

  // Tasks
  TASK_CREATED: "task.created",
  TASK_UPDATED: "task.updated",
  TASK_DELETED: "task.deleted",
  TASK_ASSIGNED: "task.assigned",
  TASK_STATUS_CHANGED: "task.status_changed",

  // Bugs
  BUG_CREATED: "bug.created",
  BUG_UPDATED: "bug.updated",
  BUG_DELETED: "bug.deleted",
  BUG_ASSIGNED: "bug.assigned",
  BUG_STATUS_CHANGED: "bug.status_changed",

  // Orders
  ORDER_CREATED: "order.created",
  ORDER_UPDATED: "order.updated",
  ORDER_DELETED: "order.deleted",
  ORDER_STATUS_CHANGED: "order.status_changed",

  // Comments
  COMMENT_CREATED: "comment.created",
  COMMENT_UPDATED: "comment.updated",
  COMMENT_DELETED: "comment.deleted",

  // Documents
  DOCUMENT_UPLOADED: "document.uploaded",
  DOCUMENT_UPDATED: "document.updated",
  DOCUMENT_DELETED: "document.deleted",
} as const;

export type AuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];
