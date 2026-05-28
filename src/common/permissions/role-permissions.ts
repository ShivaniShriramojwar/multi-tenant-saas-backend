import { UserRole } from "../interfaces/auth.interface";

type Permission =
  | "create_order"
  | "view_own_orders"
  | "view_all_orders"
  | "delete_order"
  | "view_users"
  | "create_user"
  | "delete_user"
  | "manage_roles"
  | "view_audit_logs";

const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    "create_order",
    "view_own_orders",
    "view_all_orders",
    "delete_order",
    "view_users",
    "create_user",
    "delete_user",
    "manage_roles",
    "view_audit_logs",
  ],
  manager: [
    "create_order",
    "view_own_orders",
    "view_all_orders",
    "view_users",
  ],
  user: ["create_order", "view_own_orders"],
};

const hasPermission = (role: UserRole, permission: Permission) => {
  return rolePermissions[role].includes(permission);
};

const getRolePermissions = () => rolePermissions;

const updateRolePermissions = (role: UserRole, permissions: Permission[]) => {
  rolePermissions[role] = permissions;
  return rolePermissions[role];
};

export {
  Permission,
  rolePermissions,
  hasPermission,
  getRolePermissions,
  updateRolePermissions,
};
