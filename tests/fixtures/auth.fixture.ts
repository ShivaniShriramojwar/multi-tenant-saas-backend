import { generateToken } from "../../src/common/utils/jwt.util";
import { ROLES, UserRole } from "../../src/common/constants/roles";
import { AuthTokenPayload } from "../../src/common/interfaces/auth.interface";

const tenantAId = "64f000000000000000000001";
const tenantBId = "64f000000000000000000002";
const superAdminId = "64f000000000000000000101";
const developerId = "64f000000000000000000102";

const authPayload = (
  overrides: Partial<AuthTokenPayload> = {},
): AuthTokenPayload => ({
  userId: superAdminId,
  tenantId: tenantAId,
  role: ROLES.SUPER_ADMIN,
  ...overrides,
});

const authToken = (overrides: Partial<AuthTokenPayload> = {}) => {
  return generateToken(authPayload(overrides));
};

const bearer = (overrides: Partial<AuthTokenPayload> = {}) => {
  return `Bearer ${authToken(overrides)}`;
};

const roleBearer = (role: UserRole, tenantId = tenantAId) => {
  return bearer({
    role,
    tenantId,
    userId: role === ROLES.DEVELOPER ? developerId : superAdminId,
  });
};

export {
  authPayload,
  authToken,
  bearer,
  roleBearer,
  tenantAId,
  tenantBId,
  superAdminId,
  developerId,
};
