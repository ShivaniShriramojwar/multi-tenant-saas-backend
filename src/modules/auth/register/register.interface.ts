import { UserRole } from "../../../common/constants/roles";
import { Permission } from "../../../common/permissions/role-permissions";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  tenantName: string;
}

interface RegisterResponse {
  accessToken: string;
  refreshToken: string;

  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    tenantId: string;
    permissions: readonly Permission[];
  };

  tenant: {
    id: string;
    name: string;
  };
}

export { RegisterInput, RegisterResponse };
