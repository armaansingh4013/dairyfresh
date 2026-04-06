import { Router } from "express";
import { z } from "zod";
import { updateDelivery } from "../lib/store.js";

const router = Router();

router.patch("/:deliveryId", async (req, res) => {
  const body = z
    .object({
      status: z.enum(["PENDING", "DELIVERED", "MISSED", "CANCELLED"]).optional(),
      note: z.string().optional()
    })
    .safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const delivery = await updateDelivery(req.params.deliveryId, body.data);
  if (!delivery) {
    return res.status(404).json({ error: "Delivery not found" });
  }

  res.json(delivery);
});

export default router;
