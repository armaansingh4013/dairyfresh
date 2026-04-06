import crypto from "crypto";
import { Product, Plan, Payment, Invoice, User } from "../models/index.js";
import { addDays, toDateOnly, toDateKey } from "../utils/date.js";
import { upsertDeliveryRecord, recalculatePlanStats } from "./deliveries.service.js";

const DEMO_PRODUCTS = [
  {
    name: "A2 Cow Milk",
    description: "Daily farm-fresh milk with a smooth texture for tea and breakfast.",
    unit: "L",
    price: 64,
    imageUrl: "",
    isActive: true
  },
  {
    name: "Buffalo Milk",
    description: "Richer milk for thicker curd, sweets, and creamier chai.",
    unit: "L",
    price: 72,
    imageUrl: "",
    isActive: true
  },
  {
    name: "Set Curd",
    description: "Fresh curd cultured overnight and packed for same-day dispatch.",
    unit: "500 g",
    price: 48,
    imageUrl: "",
    isActive: true
  }
];

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}

function getDefaultAddress(user) {
  return user.addresses.find((address) => address.isDefault) || user.addresses[0] || null;
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

export async function ensureCoreDemoData() {
  const count = await Product.countDocuments();
  if (count > 0) return;
  await Product.insertMany(DEMO_PRODUCTS);
}

export async function ensureDemoCustomerData(user) {
  await ensureCoreDemoData();

  const userDoc = await User.findById(user.id || user._id);
  if (!userDoc) return;

  if (!getDefaultAddress(userDoc)) {
    userDoc.addresses.push({
      title: "Home",
      houseNumber: "12",
      line1: "12 Palm Residency",
      line2: "",
      landmark: "Near 12th Main",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560038",
      lat: null,
      lng: null,
      isDefault: true
    });
    await userDoc.save();
  }

  const hasPlan = await Plan.exists({ userId: userDoc._id });
  if (hasPlan) return;

  const product = await Product.findOne().sort({ createdAt: 1 });
  const address = getDefaultAddress(userDoc);
  if (!product || !address) return;

  const startDate = toDateOnly(addDays(new Date(), -5));
  const endDate = toDateOnly(addDays(new Date(), 10));

  const days = {};
  for (let offset = -5; offset <= 10; offset += 1) {
    const date = addDays(new Date(), offset);
    const key = toDateKey(date);
    days[key] = {
      date: toDateOnly(date),
      quantity: 1,
      status: offset < 0 ? "DELIVERED" : "PENDING",
      delivered: offset < 0 ? 1 : 0,
      addressId: address._id
    };
  }

  const plan = await Plan.create({
    userId: userDoc._id,
    productId: product._id,
    startDate,
    endDate,
    mode: "EVERYDAY",
    defaultQuantity: 1,
    status: "ACTIVE",
    days
  });

  for (let offset = -5; offset <= 10; offset += 1) {
    await upsertDeliveryRecord({
      userId: userDoc._id,
      addressId: address._id,
      productId: product._id,
      planId: plan._id,
      date: addDays(new Date(), offset),
      quantity: 1,
      status: offset < 0 ? "DELIVERED" : "PENDING",
      note: ""
    });
  }

  await recalculatePlanStats(plan._id);

  const today = new Date();
  const previousMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const dueInvoice = await createInvoiceRecord({
    userId: userDoc._id,
    month: today.getMonth() + 1,
    year: today.getFullYear(),
    totalAmount: 1248,
    status: "DUE"
  });

  const paidInvoice = await createInvoiceRecord({
    userId: userDoc._id,
    month: previousMonthDate.getMonth() + 1,
    year: previousMonthDate.getFullYear(),
    totalAmount: 1184,
    status: "PAID"
  });

  const hasPayment = await Payment.exists({ invoiceId: paidInvoice._id });
  if (!hasPayment) {
    await Payment.create({
      invoiceId: paidInvoice._id,
      provider: "UPI",
      amount: paidInvoice.totalAmount,
      status: "SUCCESS",
      reference: `DEMO-${createId("pay").slice(-6)}`
    });
  }

  dueInvoice.updatedAt = new Date();
  await dueInvoice.save();
}