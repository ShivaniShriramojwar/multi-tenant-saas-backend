import { z } from "zod";
import { idParamSchema } from "../../../common/middleware/validate.middleware";

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});
const sessionIdSchema = idParamSchema;

export { refreshTokenSchema, sessionIdSchema };
