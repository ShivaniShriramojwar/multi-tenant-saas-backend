import { z } from "zod";
import { AUDIT_TARGETS } from "../../common/constants/audit-targets";

const auditLogsQuerySchema = z.object({
  action: z.string().trim().min(1).optional(),
  targetType: z.enum(AUDIT_TARGETS).optional(),
  search: z.string().trim().min(1).optional(),
});

export { auditLogsQuerySchema };
