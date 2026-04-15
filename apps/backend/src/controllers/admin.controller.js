import {
  createOperationalUser,
  listOperationalUsers,
} from "../services/auth.service.js";
import {
  getAdminCustomerDetail,
  listAdminOrders,
  listAdminDeliveries,
  getAdminReportsSummary,
  getAdminSubscriptionDetail,
  listAdminCustomers,
  listAdminDailyDeliveries,
  listAdminSubscriptions
} from "../services/admin.service.js";
import { generateInvoices, listAdminInvoices } from "../services/billing.service.js";
import { generateDeliveries } from "../services/deliveries.service.js";
import { sanitizeUser } from "../utils/session.js";
import { updateOrderStatus } from "../services/orders.service.js";
import { badRequest } from "../utils/response.js";
import { updateAdminOrderStatusSchema } from "../validations/admin.validation.js";
import { createOperationalUserSchema } from "../validations/users.validation.js";

export async function getDailyDeliveries(req, res) {
  const date = req.query.date ? new Date(String(req.query.date)) : new Date();
  res.json(await listAdminDailyDeliveries(date));
}

export async function getAdminDeliveries(req, res) {
  const date = req.query.date ? new Date(String(req.query.date)) : new Date();
  const scope = String(req.query.scope || "today");
  res.json(await listAdminDeliveries(scope, date));
}

export async function getAdminOrders(req, res) {
  const date = req.query.date ? new Date(String(req.query.date)) : new Date();
  const scope = String(req.query.scope || "today");
  res.json(await listAdminOrders(scope, date));
}

export async function updateAdminOrderStatusController(req, res) {
  const parsed = updateAdminOrderStatusSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest("Invalid order status");

  const order = await updateOrderStatus(req.params.orderId, parsed.data.status);
  if (!order) throw badRequest("Order not found");

  res.json(order);
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

export async function getOperationalUsers(req, res) {
  const users = await listOperationalUsers();
  res.json(users.map((user) => sanitizeUser(user)));
}

export async function createOperationalUserController(req, res) {
  const parsed = createOperationalUserSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest("Invalid user payload");

  const user = await createOperationalUser(parsed.data);
  res.status(201).json(sanitizeUser(user));
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
