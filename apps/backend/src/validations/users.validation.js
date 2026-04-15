import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional()
});

export const createAddressSchema = z.object({
  title: z.string().min(1),
  recipientName: z.string().min(1).optional(),
  recipientPhone: z.string().min(6).optional(),
  houseNumber: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(3),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isDefault: z.boolean().optional()
});

export const updateAddressSchema = z.object({
  title: z.string().min(1).optional(),
  recipientName: z.string().min(1).optional(),
  recipientPhone: z.string().min(6).optional(),
  houseNumber: z.string().min(1).optional(),
  line1: z.string().min(1).optional(),
  line2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  postalCode: z.string().min(3).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isDefault: z.boolean().optional()
});

export const createUserPlanSchema = z.object({
  productId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  addressId: z.string().optional(),
  mode: z.enum(["EVERYDAY", "CUSTOM"]),
  defaultQuantity: z.number().nonnegative(),
  days: z
    .array(
      z.object({
        date: z.string(),
        quantity: z.number().nonnegative(),
        addressId: z.string().optional()
      })
    )
    .optional()
});

export const createOperationalUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "DELIVERY"])
});
