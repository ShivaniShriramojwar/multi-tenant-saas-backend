import { UserRole } from "../../../common/interfaces/auth.interface";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  tenantName: string;
  role: UserRole;
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
