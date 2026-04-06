import { Router } from "express";
import { z } from "zod";
import { createOrder, listUserOrders } from "../lib/store.js";

const router = Router();

router.post("/", async (req, res) => {
  const body = z
    .object({
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
    })
    .safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const order = await createOrder(body.data);
  if (!order) {
    return res.status(400).json({ error: "Invalid user, address, or product data" });
  }

  res.status(201).json(order);
});

router.get("/", async (req, res) => {
  const userId = String(req.query.userId || "");
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  res.json(await listUserOrders(userId));
});

router.get("/users/:userId", async (req, res) => {
  res.json(await listUserOrders(req.params.userId));
});

export default router;
