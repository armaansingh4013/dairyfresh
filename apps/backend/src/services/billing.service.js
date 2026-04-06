import crypto from "crypto";
import { Delivery, Invoice, Payment } from "../models/index.js";

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}

async function hydrateInvoice(invoiceDoc) {
  if (!invoiceDoc) return null;

  const invoice = await Invoice.findById(invoiceDoc._id).populate("userId");
  if (!invoice) return null;

  const payments = await Payment.find({ invoiceId: invoice._id }).sort({ createdAt: 1 });

  return {
    ...invoice.toObject({ depopulate: false }),
    id: invoice._id.toString(),
    user: invoice.userId,
    payments
  };
}

async function createInvoiceRecord(payload) {
  let invoice = await Invoice.findOne({
    userId: payload.userId,
    month: payload.month,
    year: payload.year
  });

  if (invoice) {
    Object.assign(invoice, payload);
    await invoice.save();
    return invoice;
  }

  return Invoice.create({
    ...payload,
    pdfUrl: payload.pdfUrl || ""
  });
}

export async function listUserInvoices(userId) {
  const invoices = await Invoice.find({ userId }).sort({ year: -1, month: -1 });
  return Promise.all(invoices.map((invoice) => hydrateInvoice(invoice)));
}

export async function createPayment(invoiceId, provider) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) return null;

  const payment = await Payment.create({
    invoiceId: invoice._id,
    provider,
    amount: invoice.totalAmount,
    status: "SUCCESS",
    reference: `PAY-${createId("pay").slice(-8)}`
  });

  invoice.status = "PAID";
  await invoice.save();

  return payment;
}

export async function listAdminInvoices(month, year) {
  const invoices = await Invoice.find({ month, year }).sort({ status: 1 });
  return Promise.all(invoices.map((invoice) => hydrateInvoice(invoice)));
}

export async function generateInvoices(month, year) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const deliveries = await Delivery.find({
    date: { $gte: start, $lte: end },
    status: { $nin: ["CANCELLED", "SKIPPED"] }
  }).populate("productId");

  const totals = new Map();

  deliveries.forEach((delivery) => {
    const key = delivery.userId.toString();
    const total =
      Number(totals.get(key) || 0) +
      Number(delivery.quantity || 0) * Number(delivery.productId?.price || 0);
    totals.set(key, total);
  });

  let created = 0;
  for (const [userId, totalAmount] of totals.entries()) {
    const existing = await Invoice.findOne({ userId, month, year });

    await createInvoiceRecord({
      userId,
      month,
      year,
      totalAmount,
      status: existing?.status === "PAID" ? "PAID" : "DUE"
    });

    if (!existing) created += 1;
  }

  return { created };
}