

import { Delivery, Invoice, Plan } from "../models/index.js";
import { sameDate, startOfDay } from "../utils/date.js";
import { hydratePlan } from "./plans.service.js";
import { listDailyDeliveries } from "./deliveries.service.js";
import { listAdminInvoices } from "./billing.service.js";

export async function listAdminSubscriptions(includeCancelled = false) {
  const filter = includeCancelled ? {} : { status: { $ne: "CANCELLED" } };
  const plans = await Plan.find(filter).sort({ updatedAt: -1 });
  return Promise.all(plans.map((plan) => hydratePlan(plan)));
}

export async function getAdminReportsSummary() {
  const [activeSubscribers, deliveries, invoices] = await Promise.all([
    Plan.countDocuments({ status: "ACTIVE" }),
    Delivery.find({}),
    Invoice.find({})
  ]);

  const today = startOfDay(new Date());

  const todayLitres = deliveries
    .filter((delivery) => sameDate(delivery.date, today) && delivery.status !== "CANCELLED")
    .reduce((sum, delivery) => sum + Number(delivery.quantity || 0), 0);

  const deliveredCount = deliveries.filter((delivery) => delivery.status === "DELIVERED").length;
  const pendingCount = deliveries.filter((delivery) => delivery.status === "PENDING").length;

  const totalRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);

  const paidRevenue = invoices
    .filter((invoice) => invoice.status === "PAID")
    .reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);

  const activePlans = await Plan.find({ status: "ACTIVE" });
  const deliveredPlanIds = new Set(
    deliveries
      .filter((delivery) => delivery.planId && delivery.status === "DELIVERED")
      .map((delivery) => delivery.planId.toString())
  );

  const retained = activePlans.filter((plan) => deliveredPlanIds.has(plan._id.toString())).length;

  return {
    activeSubscribers,
    dailyLitres: todayLitres,
    deliveredCount,
    pendingCount,
    retention: activeSubscribers ? Math.round((retained / activeSubscribers) * 100) : 0,
    totalRevenue,
    paidRevenue
  };
}