import { z } from "zod";
import { ORDER_STATUSES } from "../../common/constants/order-status";
import { PAYMENT_STATUSES } from "../../common/constants/payment-status";
import { idParamSchema } from "../../common/middleware/validate.middleware";

const createOrderSchema = z.object({
  productName: z.string().trim().min(1, "Product name is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
});

const getOrdersQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
});

const orderIdSchema = idParamSchema;

export { createOrderSchema, getOrdersQuerySchema, orderIdSchema };
