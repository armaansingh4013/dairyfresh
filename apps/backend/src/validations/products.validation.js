import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().default("L"),
  price: z.number().positive(),
  imageUrl: z.string().optional()
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  price: z.number().positive().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional()
});