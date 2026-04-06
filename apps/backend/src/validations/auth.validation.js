import { z } from "zod";

export const requestOtpSchema = z.object({
  phone: z.string().min(8)
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(8),
  otp: z.string().min(4),
  name: z.string().min(1).optional(),
  email: z.string().email().optional()
});