import { listAdminSubscriptions, getAdminReportsSummary } from "../services/admin.service.js";
import { generateInvoices, listAdminInvoices } from "../services/billing.service.js";
import { generateDeliveries, listDailyDeliveries } from "../services/deliveries.service.js";
import { listTodaysOrders } from "../services/orders.service.js";
import { badRequest } from "../utils/response.js";

export async function getDailyDeliveries(req, res) {
  const date = req.query.date ? new Date(String(req.query.date)) : new Date();
  // res.json(await listDailyDeliveries(date));
  res.json(await listTodaysOrders(date));
}

export async function getSubscriptionsSummary(req, res) {
  res.json(await listAdminSubscriptions(false));
}

export async function getSubscriptions(req, res) {
  res.json(await listAdminSubscriptions(false));
}

export async function getAdminInvoices(req, res) {
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();

  res.json(await listAdminInvoices(month, year));
}

export async function getReportsSummary(req, res) {
  res.json(await getAdminReportsSummary());
}

export async function generateDailyDeliveries(req, res) {
  const date = req.query.date ? new Date(String(req.query.date)) : new Date();
  res.json(await generateDeliveries(date));
}

export async function generateMonthlyInvoices(req, res) {
  const month = Number(req.query.month);
  const year = Number(req.query.year);

  if (!month || !year) {
    throw badRequest("month and year are required");
  }

  res.json(await generateInvoices(month, year));
}