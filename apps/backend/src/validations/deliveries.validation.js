import { z } from "zod";

export const updateDeliverySchema = z.object({
  status: z.enum(["PENDING", "DELIVERED", "MISSED", "CANCELLED", "SKIPPED"]).optional(),
  note: z.string().optional()
});