import { z } from "zod";

export const createOrderSchema = z.object({
  userId: z.string(),
  addressId: z.string(),
  date: z.string(),
  note: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().positive()
    })
  ).min(1)
});