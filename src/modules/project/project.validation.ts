import { z } from "zod";
import { PROJECT_STATUSES } from "../../common/constants/project-status";
import { idParamSchema } from "../../common/middleware/validate.middleware";

const createProjectSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().min(5),

  status: z.enum(["ACTIVE", "COMPLETED", "ON_HOLD"]).optional(),
  startDate: z.coerce.date().optional(),

  endDate: z.coerce.date().optional(),
});
const updateProjectSchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    description: z.string().trim().min(5).optional(),
    status: z.enum(PROJECT_STATUSES).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
const getProjectsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
});
const projectIdSchema = idParamSchema;

export {
  createProjectSchema,
  getProjectsQuerySchema,
  projectIdSchema,
  updateProjectSchema,
};
