import { z } from "zod";

const optionalDateSchema = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date;
}, z.date("Invalid date").optional());

const reportQuerySchema = z.object({
  fromDate: optionalDateSchema,
  toDate: optionalDateSchema,
  format: z.enum(["json", "csv", "excel", "pdf"]).default("json"),
  upload: z.coerce.boolean().default(false),
});

export { reportQuerySchema };
