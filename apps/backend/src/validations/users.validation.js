import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional()
});

export const createAddressSchema = z.object({
  title: z.string().min(1),
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