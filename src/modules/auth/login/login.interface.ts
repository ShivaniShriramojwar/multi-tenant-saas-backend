import { UserRole } from "../../../common/constants/roles";
import { Permission } from "../../../common/permissions/role-permissions";

interface LoginInput {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;

  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    permissions: readonly Permission[];
  };
}

export { LoginInput, LoginResponse };
