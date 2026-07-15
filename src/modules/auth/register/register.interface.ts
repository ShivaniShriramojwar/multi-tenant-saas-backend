import { UserRole } from "../../../common/constants/roles";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  tenantName: string;
}

interface RegisterResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    tenantId: string;
  };

  tenant: {
    id: string;
    name: string;
  };
}

export { RegisterInput, RegisterResponse };
