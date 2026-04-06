import { z } from "zod";

export const createPaymentSchema = z.object({
  provider: z.string().min(1).default("UPI")
});