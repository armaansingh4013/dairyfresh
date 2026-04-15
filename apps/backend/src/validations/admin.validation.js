import { z } from "zod";

export const updateAdminOrderStatusSchema = z.object({
  status: z.enum(["PLACED", "SCHEDULED", "COMPLETED", "CANCELLED"])
});
