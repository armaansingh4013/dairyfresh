// import { z } from "zod";

// export const requestOtpSchema = z.object({
//   phone: z.string().min(8)
// });

// export const verifyOtpSchema = z.object({
//   phone: z.string().min(8),
//   otp: z.string().min(4),
//   name: z.string().min(1).optional(),
//   email: z.string().email().optional()
// });



import { z } from "zod";

export const staffLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6)
});

export const requestOtpSchema = z.object({
  phone: z.string().min(8).optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).optional()
}).refine((data) => data.phone || data.email, {
  message: "phone or email is required"
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(8).optional(),
  email: z.string().email().optional(),
  otp: z.string().min(4),
  name: z.string().min(1).optional(),
  emailName: z.string().min(1).optional()
}).refine((data) => data.phone || data.email, {
  message: "phone or email is required"
});
