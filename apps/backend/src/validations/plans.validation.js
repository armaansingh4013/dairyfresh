import { z } from "zod";

export const updatePlanSchema = z.object({
  status: z.enum(["ACTIVE", "CANCELLED"]).optional(),
  defaultQuantity: z.number().nonnegative().optional()
});

export const upsertPlanDaysSchema = z.object({
  days: z.array(
    z.object({
      date: z.string(),
      quantity: z.number().nonnegative(),
      addressId: z.string().optional(),
      status: z.enum(["PENDING", "SKIPPED", "MISSED", "DELIVERED"]).optional(),
      delivered: z.number().min(0).optional()
    })
  )
});