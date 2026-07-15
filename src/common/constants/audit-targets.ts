export const AUDIT_TARGET = {
  USER: "user",
  ORDER: "order",
  PROJECT: "project",
  TASK: "task",
  BUG: "bug",
  PERMISSION: "permission",
  COMMENT: "comment",
  DOCUMENT: "document",
} as const;

export type AuditTarget = (typeof AUDIT_TARGET)[keyof typeof AUDIT_TARGET];

export const AUDIT_TARGETS = Object.values(AUDIT_TARGET);
