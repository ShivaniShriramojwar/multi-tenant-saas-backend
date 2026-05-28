import {
  getRolePermissions,
  updateRolePermissions,
} from "../../common/permissions/role-permissions";
import { createAuditLog } from "../audit/audit.service";

interface UpdatePermissionsInput {
  role: "admin" | "manager" | "user";
  permissions: any[];
}

const getPermissionsService = () => {
  return getRolePermissions();
};

const updatePermissionsService = async (
  data: UpdatePermissionsInput,
  tenantId: string,
  actorUserId: string,
) => {
  const previousPermissions = [...getRolePermissions()[data.role]];
  const updatedPermissions = updateRolePermissions(data.role, data.permissions);

  await createAuditLog({
    tenantId,
    actorUserId,
    action: "permission.updated",
    targetType: "permission",
    targetId: data.role,
    details: {
      role: data.role,
      previousPermissions,
      updatedPermissions,
    },
  });

  return {
    role: data.role,
    permissions: updatedPermissions,
  };
};

export { getPermissionsService, updatePermissionsService };
