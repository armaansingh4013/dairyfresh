import { Router } from "express";
import { z } from "zod";
import { createProduct, listProducts, updateProduct } from "../lib/store.js";

const router = Router();

router.get("/", async (req, res) => {
  const includeInactive = String(req.query.includeInactive || "") === "true";
  res.json(await listProducts(includeInactive));
});

router.post("/", async (req, res) => {
  const body = z
    .object({
      name: z.string().min(1),
      description: z.string().optional(),
      unit: z.string().default("L"),
      price: z.number().positive(),
      imageUrl: z.string().optional()
    })
    .safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  res.json(await createProduct(body.data));
});

router.patch("/:productId", async (req, res) => {
  const body = z
    .object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      unit: z.string().optional(),
      price: z.number().positive().optional(),
      imageUrl: z.string().optional(),
      isActive: z.boolean().optional()
    })
    .safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const product = await updateProduct(req.params.productId, body.data);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json(product);
});

export default router;
