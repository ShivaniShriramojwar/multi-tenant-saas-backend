import { UserRole } from "../../../common/constants/roles";

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
  };
}

export { LoginInput, LoginResponse };
