export const ROLES = {
  SUPER_ADMIN: "super_admin",
  HEAD_PRODUCT_MANAGER: "head_product_manager",
  TEAM_LEAD: "team_lead",
  DEVELOPER: "developer",
  TESTER: "tester",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const USER_ROLES = Object.values(ROLES);
