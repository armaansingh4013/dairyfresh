import { Router } from "express";
import { z } from "zod";
import {
  createAddress,
  createPlan,
  deleteAddress,
  listAddresses,
  listUserDeliveries,
  listUserInvoices,
  listUserPlans,
  listUserSummary,
  updateAddress,
  updateUser
} from "../lib/store.js";
import { sanitizeUser } from "../lib/session.js";
import { toDateOnly } from "../utils/date.js";

const router = Router();

router.get("/:userId/addresses", async (req, res) => {
  res.json(await listAddresses(req.params.userId));
});

router.post("/:userId/addresses", async (req, res) => {
  const body = z
    .object({
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
    })
    .safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  res.json(await createAddress(req.params.userId, body.data));
});

router.patch("/:userId", async (req, res) => {
  const body = z
    .object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional()
    })
    .safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const user = await updateUser(req.params.userId, body.data);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(sanitizeUser(user));
});

router.patch("/addresses/:addressId", async (req, res) => {
  const body = z
    .object({
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
    })
    .safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const address = await updateAddress(req.params.addressId, body.data);
  if (!address) {
    return res.status(404).json({ error: "Address not found" });
  }

  res.json(address);
});

router.delete("/addresses/:addressId", async (req, res) => {
  await deleteAddress(req.params.addressId);
  res.json({ success: true });
});

router.get("/:userId/plans", async (req, res) => {
  res.json(await listUserPlans(req.params.userId));
});

router.post("/:userId/plans", async (req, res) => {
  const body = z
    .object({
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
    })
    .safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const startDate = toDateOnly(body.data.startDate);
  const endDate = toDateOnly(body.data.endDate);
  if (endDate < startDate) {
    return res.status(400).json({ error: "endDate must be after startDate" });
  }

  const plan = await createPlan(req.params.userId, body.data);
  if (!plan) {
    return res.status(400).json({ error: "Invalid userId or productId" });
  }

  res.json(plan);
});

router.get("/:userId/deliveries", async (req, res) => {
  res.json(await listUserDeliveries(req.params.userId));
});

router.get("/:userId/invoices", async (req, res) => {
  res.json(await listUserInvoices(req.params.userId));
});

router.get("/:userId/summary", async (req, res) => {
  const summary = await listUserSummary(req.params.userId);
  if (!summary) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(summary);
});

export default router;
