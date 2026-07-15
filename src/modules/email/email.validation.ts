import { z } from "zod";
import { idParamSchema } from "../../common/middleware/validate.middleware";

import { EMAIL_STATUS } from "./email.model";

const optionalDateSchema = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date;
}, z.date("Invalid date").optional());

const emailAddressSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .toLowerCase();

const optionalEmailListSchema = z
  .array(emailAddressSchema)
  .min(1, "At least one email address is required")
  .optional();

const sendEmailSchema = z.object({
  to: z
    .array(emailAddressSchema)
    .min(1, "At least one recipient is required"),
  cc: optionalEmailListSchema,
  bcc: optionalEmailListSchema,
  subject: z.string().trim().min(1, "Subject is required").max(200),
  body: z.string().trim().min(1, "Body is required"),
  templateKey: z.string().trim().min(1).max(120).optional(),
  sendNow: z.boolean().default(true),
});

const emailLogListQuerySchema = z.object({
  status: z.enum(Object.values(EMAIL_STATUS)).optional(),
  requestedBy: z.string().trim().min(1).optional(),
  templateKey: z.string().trim().min(1).optional(),
  fromDate: optionalDateSchema,
  toDate: optionalDateSchema,
  search: z.string().trim().min(1).optional(),
});

const emailSummaryQuerySchema = z.object({
  requestedBy: z.string().trim().min(1).optional(),
  templateKey: z.string().trim().min(1).optional(),
  fromDate: optionalDateSchema,
  toDate: optionalDateSchema,
});
const emailLogIdSchema = idParamSchema;

export {
  sendEmailSchema,
  emailLogListQuerySchema,
  emailSummaryQuerySchema,
  emailLogIdSchema,
};
