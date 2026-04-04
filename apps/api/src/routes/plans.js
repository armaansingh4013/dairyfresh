import { Router } from "express";
import { z } from "zod";
import { createPlanPause, updatePlan, upsertPlanDays } from "../lib/store.js";

const router = Router();

router.patch("/:planId", async (req, res) => {
  const body = z
    .object({
      status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).optional(),
      defaultQuantity: z.number().nonnegative().optional()
    })
    .safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const plan = updatePlan(req.params.planId, body.data);
  if (!plan) {
    return res.status(404).json({ error: "Plan not found" });
  }

  res.json(plan);
});

router.post("/:planId/days", async (req, res) => {
  const body = z
    .object({
      days: z.array(
        z.object({
          date: z.string(),
          quantity: z.number().nonnegative(),
          addressId: z.string().optional()
        })
      )
    })
    .safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  res.json(upsertPlanDays(req.params.planId, body.data.days));
});

router.post("/:planId/pause", async (req, res) => {
  const body = z
    .object({ startDate: z.string(), endDate: z.string() })
    .safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  res.json(createPlanPause(req.params.planId, body.data));
});

export default router;
