import {
  getAdminCustomerDetail,
  getAdminReportsSummary,
  getAdminSubscriptionDetail,
  listAdminCustomers,
  listAdminDailyDeliveries,
  listAdminSubscriptions
} from "../services/admin.service.js";
import { generateInvoices, listAdminInvoices } from "../services/billing.service.js";
import { generateDeliveries } from "../services/deliveries.service.js";
import { badRequest } from "../utils/response.js";

export async function getDailyDeliveries(req, res) {
  const date = req.query.date ? new Date(String(req.query.date)) : new Date();
  res.json(await listAdminDailyDeliveries(date));
}

export async function getSubscriptionsSummary(req, res) {
  const plans = await listAdminSubscriptions(false);
  res.json(plans.filter((plan) => plan.status === "ACTIVE"));
}

export async function getSubscriptions(req, res) {
  res.json(await listAdminSubscriptions(false));
}

export async function getSubscriptionDetail(req, res) {
  res.json(await getAdminSubscriptionDetail(req.params.planId));
}

export async function getCustomers(req, res) {
  res.json(await listAdminCustomers());
}

export async function getCustomerDetail(req, res) {
  res.json(await getAdminCustomerDetail(req.params.customerId));
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
