import {
  getRolePermissions,
  Permission,
} from "../../common/permissions/role-permissions";
import { UserRole } from "../../common/constants/roles";

const getPermissionsService = () => {
  return getRolePermissions();
};

const updatePermissionsService = (
  role: UserRole,
  permissions: Permission[],
  tenantId: string,
  actorUserId: string,
) => {
  return {
    role,
    permissions,
    tenantId,
    updatedBy: actorUserId,
  };
};

export { getPermissionsService, updatePermissionsService };
