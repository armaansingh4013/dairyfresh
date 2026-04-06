import crypto from "crypto";
import { addDays, endOfDay, startOfDay, toDateOnly } from "../utils/date.js";
import { Delivery, Invoice, ObjectId, Order, Payment, Plan, Product, User } from "../models/index.js";

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

function toObjectId(value) {
  if (!value || !ObjectId.isValid(value)) {
    return null;
  }

  return new ObjectId(value);
}

function normalizeEntity(value, seen = new WeakSet()) {
  if (value == null) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof ObjectId) {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeEntity(item, seen));
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return null;
    }

    seen.add(value);
    const output = {};
    for (const [key, item] of Object.entries(value)) {
      if (key === "__v") {
        continue;
      }

      if (key === "_id") {
        output.id = normalizeEntity(item, seen);
        continue;
      }

      output[key] = normalizeEntity(item, seen);
    }
    return output;
  }

  return value;
}

function serializeDocument(document) {
  if (!document) {
    return null;
  }

  const raw =
    typeof document.toObject === "function"
      ? document.toObject({ depopulate: false })
      : document;

  return normalizeEntity(raw);
}

function sameDate(left, right) {
  return toDateOnly(left).getTime() === toDateOnly(right).getTime();
}

function compareDesc(left, right) {
  return new Date(right).getTime() - new Date(left).getTime();
}

function compareAsc(left, right) {
  return new Date(left).getTime() - new Date(right).getTime();
}

function getDefaultAddress(user) {
  return user.addresses.find((address) => address.isDefault) || user.addresses[0] || null;
}

function embeddedAddressToResponse(user, address) {
  if (!user || !address) {
    return null;
  }

  const raw = address.toObject ? address.toObject() : address;
  return normalizeEntity({
    ...raw,
    userId: user._id
  });
}

async function findAddressOwnerById(addressId) {
  const objectId = toObjectId(addressId);
  if (!objectId) {
    return null;
  }

  const user = await User.findOne({ "addresses._id": objectId });
  if (!user) {
    return null;
  }

  const address = user.addresses.id(objectId);
  if (!address) {
    return null;
  }

  return { user, address };
}

async function hydrateDelivery(deliveryDoc, options = {}) {
  const { includePlan = true } = options;

  if (!deliveryDoc) {
    return null;
  }

  const delivery = await Delivery.findById(deliveryDoc._id)
    .populate("userId")
    .populate("productId");

  if (!delivery) {
    return null;
  }

  if (includePlan) {
    await delivery.populate("planId");
  }

  const user = delivery.userId;
  const address =
    user && delivery.addressId ? user.addresses.id(delivery.addressId) || null : null;

  return serializeDocument({
    ...delivery.toObject({ depopulate: false }),
    user: user,
    product: delivery.productId,
    ...(includePlan ? { plan: delivery.planId } : {}),
    address: address ? { ...address.toObject(), userId: user._id } : null
  });
}

async function hydratePlan(planDoc) {
  if (!planDoc) {
    return null;
  }

  const plan = await Plan.findById(planDoc._id).populate("userId").populate("productId");
  if (!plan) {
    return null;
  }

  const deliveries = await Delivery.find({ planId: plan._id }).sort({ date: 1 });
  const hydratedDeliveries = await Promise.all(
    deliveries.map((delivery) => hydrateDelivery(delivery, { includePlan: false }))
  );

  return serializeDocument({
    ...plan.toObject({ depopulate: false }),
    user: plan.userId,
    product: plan.productId,
    deliveries: hydratedDeliveries
  });
}

async function hydrateInvoice(invoiceDoc) {
  if (!invoiceDoc) {
    return null;
  }

  const invoice = await Invoice.findById(invoiceDoc._id).populate("userId");
  if (!invoice) {
    return null;
  }

  const payments = await Payment.find({ invoiceId: invoice._id }).sort({ createdAt: 1 });

  return serializeDocument({
    ...invoice.toObject({ depopulate: false }),
    user: invoice.userId,
    payments: payments.map((payment) => payment.toObject())
  });
}

async function hydrateOrder(orderDoc) {
  if (!orderDoc) {
    return null;
  }

  const order = await Order.findById(orderDoc._id).populate("userId").populate("items.productId");
  if (!order) {
    return null;
  }

  const user = order.userId;
  const address = user?.addresses?.id(order.addressId) || null;

  return serializeDocument({
    ...order.toObject({ depopulate: false }),
    user,
    address: address ? { ...address.toObject(), userId: user._id } : null,
    items: order.items.map((item) => ({
      ...item.toObject(),
      product: item.productId
    }))
  });
}

async function upsertDeliveryRecord(payload) {
  const day = toDateOnly(payload.date);
  const nextDay = addDays(day, 1);
  let delivery = await Delivery.findOne({
    userId: payload.userId,
    productId: payload.productId,
    date: { $gte: day, $lt: nextDay }
  });

  if (delivery) {
    Object.assign(delivery, {
      addressId: payload.addressId,
      planId: payload.planId || null,
      date: day,
      quantity: payload.quantity,
      status: payload.status || delivery.status,
      note: payload.note ?? delivery.note ?? ""
    });
    await delivery.save();
    return delivery;
  }

  delivery = await Delivery.create({
    userId: payload.userId,
    addressId: payload.addressId,
    productId: payload.productId,
    planId: payload.planId || null,
    date: day,
    quantity: payload.quantity,
    status: payload.status || "PENDING",
    note: payload.note ?? ""
  });

  return delivery;
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

  invoice = await Invoice.create({
    ...payload,
    pdfUrl: payload.pdfUrl || ""
  });

  return invoice;
}

export async function ensureCoreDemoData() {
  const count = await Product.countDocuments();
  if (count > 0) {
    return;
  }

  await Product.insertMany(DEMO_PRODUCTS);
}

export async function ensureDemoCustomerData(user) {
  await ensureCoreDemoData();

  const userDoc = await User.findById(user.id);
  if (!userDoc) {
    return;
  }

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
  if (hasPlan) {
    return;
  }

  const product = await Product.findOne().sort({ createdAt: 1 });
  const address = getDefaultAddress(userDoc);
  if (!product || !address) {
    return;
  }

  const plan = await Plan.create({
    userId: userDoc._id,
    productId: product._id,
    startDate: toDateOnly(addDays(new Date(), -5)),
    endDate: toDateOnly(addDays(new Date(), 10)),
    mode: "EVERYDAY",
    defaultQuantity: 1,
    status: "ACTIVE",
    days: [],
    pauses: []
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

export async function findUserByPhone(phone) {
  const user = await User.findOne({ phone });
  return serializeDocument(user);
}

export async function getUserById(userId) {
  const objectId = toObjectId(userId);
  if (!objectId) {
    return null;
  }

  const user = await User.findById(objectId);
  return serializeDocument(user);
}

export async function upsertUserByPhone({ phone, name, email }) {
  let user = await User.findOne({ phone });

  if (user) {
    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }
    await user.save();
    return serializeDocument(user);
  }

  user = await User.create({
    phone,
    ...(name ? { name } : {}),
    ...(email ? { email } : {})
  });

  return serializeDocument(user);
}

export async function updateUser(userId, payload) {
  const objectId = toObjectId(userId);
  if (!objectId) {
    return null;
  }

  const user = await User.findById(objectId);
  if (!user) {
    return null;
  }

  Object.assign(user, payload);
  await user.save();
  return serializeDocument(user);
}

export async function listAddresses(userId) {
  const objectId = toObjectId(userId);
  if (!objectId) {
    return [];
  }

  const user = await User.findById(objectId);
  if (!user) {
    return [];
  }

  return user.addresses
    .slice()
    .sort((left, right) => Number(right.isDefault) - Number(left.isDefault))
    .map((address) => embeddedAddressToResponse(user, address));
}

export async function createAddress(userId, payload) {
  const objectId = toObjectId(userId);
  if (!objectId) {
    return null;
  }

  const user = await User.findById(objectId);
  if (!user) {
    return null;
  }

  if (payload.isDefault) {
    user.addresses.forEach((address) => {
      address.isDefault = false;
    });
  }

  user.addresses.push({
      title: payload.title,
      houseNumber: payload.houseNumber,
      line1: payload.line1,
      line2: payload.line2 || "",
    landmark: payload.landmark || "",
    city: payload.city,
    state: payload.state,
    postalCode: payload.postalCode,
    lat: payload.lat ?? null,
    lng: payload.lng ?? null,
    isDefault: Boolean(payload.isDefault)
  });

  await user.save();
  const address = user.addresses[user.addresses.length - 1];
  return embeddedAddressToResponse(user, address);
}

export async function updateAddress(addressId, payload) {
  const match = await findAddressOwnerById(addressId);
  if (!match) {
    return null;
  }

  const { user, address } = match;

  if (payload.isDefault) {
    user.addresses.forEach((item) => {
      item.isDefault = false;
    });
  }

  Object.assign(address, payload);
  await user.save();
  return embeddedAddressToResponse(user, address);
}

export async function deleteAddress(addressId) {
  const match = await findAddressOwnerById(addressId);
  if (!match) {
    return;
  }

  match.address.deleteOne();
  await match.user.save();
}

export async function listProducts(includeInactive = false) {
  const products = await Product.find(includeInactive ? {} : { isActive: true }).sort({
    createdAt: -1
  });
  return products.map(serializeDocument);
}

export async function createProduct(payload) {
  const product = await Product.create({
    description: "",
    imageUrl: "",
    isActive: true,
    ...payload
  });
  return serializeDocument(product);
}

export async function updateProduct(productId, payload) {
  const objectId = toObjectId(productId);
  if (!objectId) {
    return null;
  }

  const product = await Product.findById(objectId);
  if (!product) {
    return null;
  }

  Object.assign(product, payload);
  await product.save();
  return serializeDocument(product);
}

export async function listUserPlans(userId) {
  const objectId = toObjectId(userId);
  if (!objectId) {
    return [];
  }

  const plans = await Plan.find({ userId: objectId }).sort({ createdAt: -1 });
  return Promise.all(plans.map((plan) => hydratePlan(plan)));
}

export async function createPlan(userId, payload) {
  const userObjectId = toObjectId(userId);
  const productObjectId = toObjectId(payload.productId);
  if (!userObjectId || !productObjectId) {
    return null;
  }

  const user = await User.findById(userObjectId);
  const product = await Product.findById(productObjectId);
  if (!user || !product) {
    return null;
  }

  const days = (payload.days || []).map((day) => ({
    date: toDateOnly(day.date),
    quantity: day.quantity,
    addressId: toObjectId(day.addressId) || null
  }));

  const plan = await Plan.create({
    userId: userObjectId,
    productId: productObjectId,
    startDate: toDateOnly(payload.startDate),
    endDate: toDateOnly(payload.endDate),
    mode: payload.mode,
    defaultQuantity: payload.defaultQuantity,
    status: "ACTIVE",
    days,
    pauses: []
  });

  const defaultAddress = getDefaultAddress(user);
  for (
    let current = toDateOnly(payload.startDate);
    current <= toDateOnly(payload.endDate);
    current = addDays(current, 1)
  ) {
    const override = (payload.days || []).find((day) => sameDate(day.date, current));
    const quantity =
      payload.mode === "CUSTOM"
        ? Number(override?.quantity || 0)
        : Number(payload.defaultQuantity || 0);

    const resolvedAddressId = toObjectId(override?.addressId) || defaultAddress?._id || null;
    if (quantity <= 0 || !resolvedAddressId) {
      continue;
    }

    await upsertDeliveryRecord({
      userId: userObjectId,
      addressId: resolvedAddressId,
      productId: productObjectId,
      planId: plan._id,
      date: current,
      quantity,
      status: "PENDING",
      note: ""
    });
  }

  return hydratePlan(plan);
}

export async function updatePlan(planId, payload) {
  const objectId = toObjectId(planId);
  if (!objectId) {
    return null;
  }

  const plan = await Plan.findById(objectId);
  if (!plan) {
    return null;
  }

  Object.assign(plan, payload);
  await plan.save();

  if (payload.status === "CANCELLED") {
    await Delivery.updateMany(
      {
        planId: plan._id,
        status: "PENDING",
        date: { $gte: startOfDay(new Date()) }
      },
      {
        $set: {
          status: "CANCELLED",
          updatedAt: new Date()
        }
      }
    );
  }

  return hydratePlan(plan);
}

export async function upsertPlanDays(planId, days) {
  const objectId = toObjectId(planId);
  if (!objectId) {
    return [];
  }

  const plan = await Plan.findById(objectId).populate("userId");
  if (!plan) {
    return [];
  }

  const user = plan.userId;
  const defaultAddress = getDefaultAddress(user);

  for (const day of days) {
    const dayDate = toDateOnly(day.date);
    const existing = plan.days.find((item) => sameDate(item.date, dayDate));

    if (existing) {
      existing.quantity = day.quantity;
      existing.addressId = toObjectId(day.addressId) || existing.addressId || null;
    } else {
      plan.days.push({
        date: dayDate,
        quantity: day.quantity,
        addressId: toObjectId(day.addressId) || null
      });
    }

    const dayRecord = plan.days.find((item) => sameDate(item.date, dayDate));
    const targetAddressId = dayRecord.addressId || defaultAddress?._id || null;

    const delivery = await Delivery.findOne({
      planId: plan._id,
      productId: plan.productId,
      date: { $gte: dayDate, $lt: addDays(dayDate, 1) }
    });

    if (day.quantity <= 0) {
      if (delivery) {
        delivery.quantity = 0;
        delivery.status = "CANCELLED";
        await delivery.save();
      }
      continue;
    }

    if (!targetAddressId) {
      continue;
    }

    await upsertDeliveryRecord({
      userId: plan.userId._id,
      addressId: targetAddressId,
      productId: plan.productId,
      planId: plan._id,
      date: dayDate,
      quantity: day.quantity,
      status: delivery?.status === "DELIVERED" ? "DELIVERED" : "PENDING",
      note: delivery?.note || ""
    });
  }

  await plan.save();
  return serializeDocument(plan.days);
}

export async function createPlanPause(planId, payload) {
  const objectId = toObjectId(planId);
  if (!objectId) {
    return null;
  }

  const plan = await Plan.findById(objectId);
  if (!plan) {
    return null;
  }

  plan.pauses.push({
    startDate: toDateOnly(payload.startDate),
    endDate: toDateOnly(payload.endDate)
  });
  await plan.save();
  return serializeDocument(plan.pauses[plan.pauses.length - 1]);
}

export async function listUserDeliveries(userId) {
  const objectId = toObjectId(userId);
  if (!objectId) {
    return [];
  }

  const deliveries = await Delivery.find({ userId: objectId }).sort({ date: -1 });
  return Promise.all(deliveries.map((delivery) => hydrateDelivery(delivery)));
}

export async function updateDelivery(deliveryId, payload) {
  const objectId = toObjectId(deliveryId);
  if (!objectId) {
    return null;
  }

  const delivery = await Delivery.findById(objectId);
  if (!delivery) {
    return null;
  }

  Object.assign(delivery, payload);
  await delivery.save();
  return hydrateDelivery(delivery);
}

export async function listUserInvoices(userId) {
  const objectId = toObjectId(userId);
  if (!objectId) {
    return [];
  }

  const invoices = await Invoice.find({ userId: objectId }).sort({ year: -1, month: -1 });
  return Promise.all(invoices.map((invoice) => hydrateInvoice(invoice)));
}

export async function listUserSummary(userId) {
  const user = await getUserById(userId);
  if (!user) {
    return null;
  }

  const [addresses, plans, deliveries, invoices] = await Promise.all([
    listAddresses(userId),
    listUserPlans(userId),
    listUserDeliveries(userId),
    listUserInvoices(userId)
  ]);

  return {
    user,
    addresses,
    plans,
    deliveries: deliveries.sort((left, right) => compareAsc(left.date, right.date)),
    invoices
  };
}

export async function listAdminSubscriptions(includeCancelled = false) {
  const filter = includeCancelled ? {} : { status: { $ne: "CANCELLED" } };
  const plans = await Plan.find(filter).sort({ updatedAt: -1 });
  return Promise.all(plans.map((plan) => hydratePlan(plan)));
}

export async function listDailyDeliveries(date = new Date()) {
  const start = startOfDay(date);
  const end = endOfDay(date);
  const deliveries = await Delivery.find({
    date: { $gte: start, $lte: end },
    status: { $ne: "CANCELLED" }
  }).sort({ createdAt: 1 });

  const hydrated = await Promise.all(deliveries.map((delivery) => hydrateDelivery(delivery)));
  return hydrated.filter((delivery) => !delivery.plan || delivery.plan.status !== "CANCELLED");
}

export async function generateDeliveries(date = new Date()) {
  const targetDate = startOfDay(date);
  const plans = await Plan.find({ status: "ACTIVE" }).populate("userId");
  let created = 0;

  for (const plan of plans) {
    if (new Date(plan.startDate) > targetDate || new Date(plan.endDate) < targetDate) {
      continue;
    }

    const paused = plan.pauses.some(
      (pause) =>
        targetDate >= startOfDay(pause.startDate) && targetDate <= endOfDay(pause.endDate)
    );
    if (paused) {
      continue;
    }

    const override = plan.days.find((day) => sameDate(day.date, targetDate));
    const quantity =
      plan.mode === "CUSTOM"
        ? Number(override?.quantity || 0)
        : Number(plan.defaultQuantity || 0);
    if (quantity <= 0) {
      continue;
    }

    const user = plan.userId;
    const addressId = override?.addressId || getDefaultAddress(user)?._id || null;
    if (!addressId) {
      continue;
    }

    const existing = await Delivery.findOne({
      userId: user._id,
      productId: plan.productId,
      date: { $gte: targetDate, $lt: addDays(targetDate, 1) }
    });

    await upsertDeliveryRecord({
      userId: user._id,
      addressId,
      productId: plan.productId,
      planId: plan._id,
      date: targetDate,
      quantity,
      status: "PENDING",
      note: ""
    });

    if (!existing) {
      created += 1;
    }
  }

  return { created };
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
    status: { $ne: "CANCELLED" }
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
    if (!existing) {
      created += 1;
    }
  }

  return { created };
}

export async function createPayment(invoiceId, provider) {
  const objectId = toObjectId(invoiceId);
  if (!objectId) {
    return null;
  }

  const invoice = await Invoice.findById(objectId);
  if (!invoice) {
    return null;
  }

  const payment = await Payment.create({
    invoiceId: invoice._id,
    provider,
    amount: invoice.totalAmount,
    status: "SUCCESS",
    reference: `PAY-${createId("pay").slice(-8)}`
  });

  invoice.status = "PAID";
  await invoice.save();

  return serializeDocument(payment);
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

export async function createOrder(payload) {
  const userId = toObjectId(payload.userId);
  const addressId = toObjectId(payload.addressId);
  if (!userId || !addressId) {
    return null;
  }

  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  const address = user.addresses.id(addressId);
  if (!address) {
    return null;
  }

  const itemIds = payload.items
    .map((item) => toObjectId(item.productId))
    .filter(Boolean);
  const products = await Product.find({ _id: { $in: itemIds } });
  const productMap = new Map(products.map((product) => [product.id, product]));

  const items = payload.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      return null;
    }

    return {
      productId: product._id,
      quantity: Number(item.quantity || 0),
      productName: product.name,
      unit: product.unit,
      unitPrice: product.price
    };
  });

  if (items.some((item) => !item || item.quantity <= 0)) {
    return null;
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
    0
  );

  const order = await Order.create({
    userId,
    addressId,
    type: "NORMAL",
    planId: null,
    date: toDateOnly(payload.date),
    note: payload.note || "",
    items,
    totalAmount,
    status: "PLACED",
    paymentStatus: "SUCCESS"
  });

  return hydrateOrder(order);
}

export async function listUserOrders(userId) {
  const objectId = toObjectId(userId);
  if (!objectId) {
    return [];
  }

  const orders = await Order.find({ userId: objectId }).sort({ createdAt: -1 });
  return Promise.all(orders.map((order) => hydrateOrder(order)));
}
