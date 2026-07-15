import { assertSameTenant } from "../../common/utils/service.util";
import { getUserById } from "./user.repository";

const validateUserBelongsToTenant = async (
  userId: string,
  tenantId: string,
  entityName = "User",
) => {
  const user = await getUserById(userId);

  return assertSameTenant(user, tenantId, entityName);
};

export { validateUserBelongsToTenant };
