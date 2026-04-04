import { Router } from "express";
import {
  generateDeliveries,
  generateInvoices,
  getAdminReportsSummary,
  listAdminInvoices,
  listAdminSubscriptions,
  listDailyDeliveries
} from "../lib/store.js";

const router = Router();

router.get("/deliveries/daily", async (req, res) => {
  const date = req.query.date ? new Date(String(req.query.date)) : new Date();
  res.json(listDailyDeliveries(date));
});

router.get("/subscriptions/summary", async (req, res) => {
  res.json(listAdminSubscriptions(false));
});

router.get("/subscriptions", async (req, res) => {
  res.json(listAdminSubscriptions(false));
});

router.get("/invoices", async (req, res) => {
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();
  res.json(listAdminInvoices(month, year));
});

router.get("/reports/summary", async (req, res) => {
  res.json(getAdminReportsSummary());
});

router.post("/deliveries/generate", async (req, res) => {
  const date = req.query.date ? new Date(String(req.query.date)) : new Date();
  res.json(generateDeliveries(date));
});

router.post("/invoices/generate", async (req, res) => {
  const month = Number(req.query.month);
  const year = Number(req.query.year);

  if (!month || !year) {
    return res.status(400).json({ error: "month and year are required" });
  }

  res.json(generateInvoices(month, year));
});

export default router;
