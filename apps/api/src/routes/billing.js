import { Router } from "express";
import { z } from "zod";
import { createPayment } from "../lib/store.js";

const router = Router();

router.post("/invoices/:invoiceId/payments", async (req, res) => {
  const body = z
    .object({
      provider: z.string().min(1).default("UPI")
    })
    .safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const payment = await createPayment(req.params.invoiceId, body.data.provider);
  if (!payment) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  res.json(payment);
});

export default router;
