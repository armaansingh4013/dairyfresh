import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { addDays, endOfDay, startOfDay, toDateOnly } from "../utils/date.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "../../data");
const dataFile = path.join(dataDir, "store.json");

const EMPTY_STORE = {
  users: [],
  addresses: [],
  products: [],
  plans: [],
  planDays: [],
  planPauses: [],
  deliveries: [],
  invoices: [],
  payments: []
};

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

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(EMPTY_STORE, null, 2));
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadStore() {
  ensureDataFile();
  const raw = fs.readFileSync(dataFile, "utf8");
  return raw ? JSON.parse(raw) : clone(EMPTY_STORE);
}

function saveStore(store) {
  ensureDataFile();
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
}

function updateStore(mutator) {
  const store = loadStore();
  const result = mutator(store);
  saveStore(store);
  return result;
}

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeDate(value) {
  return toDateOnly(value).toISOString();
}

function sameDate(left, right) {
  return normalizeDate(left) === normalizeDate(right);
}

function compareDesc(left, right) {
  return new Date(right).getTime() - new Date(left).getTime();
}

function compareAsc(left, right) {
  return new Date(left).getTime() - new Date(right).getTime();
}

function getUser(store, userId) {
  return store.users.find((user) => user.id === userId) || null;
}

function getProduct(store, productId) {
  return store.products.find((product) => product.id === productId) || null;
}

function getAddress(store, addressId) {
  return store.addresses.find((address) => address.id === addressId) || null;
}

function getPlanRecord(store, planId) {
  return store.plans.find((plan) => plan.id === planId) || null;
}

function getPlanDays(store, planId) {
  return store.planDays
    .filter((day) => day.planId === planId)
    .sort((left, right) => compareAsc(left.date, right.date));
}

function getPlanPauses(store, planId) {
  return store.planPauses
    .filter((pause) => pause.planId === planId)
    .sort((left, right) => compareAsc(left.startDate, right.startDate));
}

function hydrateDelivery(store, delivery) {
  return {
    ...delivery,
    user: getUser(store, delivery.userId),
    address: getAddress(store, delivery.addressId),
    product: getProduct(store, delivery.productId),
    plan: delivery.planId ? getPlanRecord(store, delivery.planId) : null
  };
}

function hydratePlan(store, plan) {
  return {
    ...plan,
    user: getUser(store, plan.userId),
    product: getProduct(store, plan.productId),
    days: getPlanDays(store, plan.id),
    pauses: getPlanPauses(store, plan.id),
    deliveries: store.deliveries
      .filter((delivery) => delivery.planId === plan.id)
      .sort((left, right) => compareAsc(left.date, right.date))
      .map((delivery) => hydrateDelivery(store, delivery))
  };
}

function hydrateInvoice(store, invoice) {
  return {
    ...invoice,
    user: getUser(store, invoice.userId),
    payments: store.payments.filter((payment) => payment.invoiceId === invoice.id)
  };
}

function ensureProducts(store) {
  if (store.products.length > 0) {
    return;
  }

  const timestamp = nowIso();
  DEMO_PRODUCTS.forEach((product) => {
    store.products.push({
      id: createId("product"),
      ...product,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  });
}

function findDefaultAddress(store, userId) {
  return (
    store.addresses.find((address) => address.userId === userId && address.isDefault) ||
    store.addresses.find((address) => address.userId === userId) ||
    null
  );
}

function upsertDeliveryRecord(store, payload) {
  const existing = store.deliveries.find(
    (delivery) =>
      delivery.userId === payload.userId &&
      delivery.productId === payload.productId &&
      sameDate(delivery.date, payload.date)
  );

  if (existing) {
    Object.assign(existing, {
      ...payload,
      date: normalizeDate(payload.date),
      updatedAt: nowIso()
    });
    return existing;
  }

  const record = {
    id: createId("delivery"),
    status: "PENDING",
    note: "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ...payload,
    date: normalizeDate(payload.date)
  };
  store.deliveries.push(record);
  return record;
}

function createInvoiceRecord(store, payload) {
  const existing = store.invoices.find(
    (invoice) =>
      invoice.userId === payload.userId &&
      invoice.month === payload.month &&
      invoice.year === payload.year
  );

  if (existing) {
    Object.assign(existing, {
      ...payload,
      updatedAt: nowIso()
    });
    return existing;
  }

  const invoice = {
    id: createId("invoice"),
    pdfUrl: "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ...payload
  };
  store.invoices.push(invoice);
  return invoice;
}

export function ensureCoreDemoData() {
  updateStore((store) => {
    ensureProducts(store);
  });
}

export function ensureDemoCustomerData(user) {
  updateStore((store) => {
    ensureProducts(store);

    if (!findDefaultAddress(store, user.id)) {
      store.addresses.push({
        id: createId("address"),
        userId: user.id,
        title: "Home",
        line1: "12 Palm Residency",
        line2: "",
        landmark: "Near 12th Main",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560038",
        lat: null,
        lng: null,
        isDefault: true,
        createdAt: nowIso(),
        updatedAt: nowIso()
      });
    }

    const hasPlan = store.plans.some((plan) => plan.userId === user.id);
    if (hasPlan) {
      return;
    }

    const product = store.products[0];
    const address = findDefaultAddress(store, user.id);
    const planId = createId("plan");

    store.plans.push({
      id: planId,
      userId: user.id,
      productId: product.id,
      startDate: normalizeDate(addDays(new Date(), -5)),
      endDate: normalizeDate(addDays(new Date(), 10)),
      mode: "EVERYDAY",
      defaultQuantity: 1,
      status: "ACTIVE",
      createdAt: nowIso(),
      updatedAt: nowIso()
    });

    for (let offset = -5; offset <= 10; offset += 1) {
      upsertDeliveryRecord(store, {
        userId: user.id,
        addressId: address.id,
        productId: product.id,
        planId,
        date: addDays(new Date(), offset),
        quantity: 1,
        status: offset < 0 ? "DELIVERED" : "PENDING",
        note: ""
      });
    }

    const today = new Date();
    const previousMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const dueInvoice = createInvoiceRecord(store, {
      userId: user.id,
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      totalAmount: 1248,
      status: "DUE"
    });
    const paidInvoice = createInvoiceRecord(store, {
      userId: user.id,
      month: previousMonthDate.getMonth() + 1,
      year: previousMonthDate.getFullYear(),
      totalAmount: 1184,
      status: "PAID"
    });

    if (!store.payments.some((payment) => payment.invoiceId === paidInvoice.id)) {
      store.payments.push({
        id: createId("payment"),
        invoiceId: paidInvoice.id,
        provider: "UPI",
        amount: paidInvoice.totalAmount,
        status: "SUCCESS",
        reference: `DEMO-${paidInvoice.id.slice(-6)}`,
        createdAt: nowIso(),
        updatedAt: nowIso()
      });
    }

    dueInvoice.updatedAt = nowIso();
  });
}

export function findUserByPhone(phone) {
  const store = loadStore();
  return clone(store.users.find((user) => user.phone === phone) || null);
}

export function getUserById(userId) {
  const store = loadStore();
  return clone(getUser(store, userId));
}

export function upsertUserByPhone({ phone, name, email }) {
  return updateStore((store) => {
    let user = store.users.find((item) => item.phone === phone);

    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      user.updatedAt = nowIso();
      return clone(user);
    }

    user = {
      id: createId("user"),
      role: "CUSTOMER",
      phone,
      email: email || "",
      name: name || "",
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    store.users.push(user);
    return clone(user);
  });
}

export function updateUser(userId, payload) {
  return updateStore((store) => {
    const user = getUser(store, userId);
    if (!user) return null;
    Object.assign(user, payload, { updatedAt: nowIso() });
    return clone(user);
  });
}

export function listAddresses(userId) {
  const store = loadStore();
  return clone(
    store.addresses
      .filter((address) => address.userId === userId)
      .sort((left, right) => Number(right.isDefault) - Number(left.isDefault))
  );
}

export function createAddress(userId, payload) {
  return updateStore((store) => {
    if (payload.isDefault) {
      store.addresses.forEach((address) => {
        if (address.userId === userId) {
          address.isDefault = false;
          address.updatedAt = nowIso();
        }
      });
    }

    const address = {
      id: createId("address"),
      userId,
      line2: "",
      landmark: "",
      lat: null,
      lng: null,
      isDefault: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...payload
    };
    store.addresses.push(address);
    return clone(address);
  });
}

export function updateAddress(addressId, payload) {
  return updateStore((store) => {
    const address = getAddress(store, addressId);
    if (!address) return null;

    if (payload.isDefault) {
      store.addresses.forEach((item) => {
        if (item.userId === address.userId) {
          item.isDefault = false;
          item.updatedAt = nowIso();
        }
      });
    }

    Object.assign(address, payload, { updatedAt: nowIso() });
    return clone(address);
  });
}

export function deleteAddress(addressId) {
  return updateStore((store) => {
    const index = store.addresses.findIndex((address) => address.id === addressId);
    if (index >= 0) {
      store.addresses.splice(index, 1);
    }
  });
}

export function listProducts(includeInactive = false) {
  const store = loadStore();
  const list = store.products
    .filter((product) => includeInactive || product.isActive)
    .sort((left, right) => compareDesc(left.createdAt, right.createdAt));
  return clone(list);
}

export function createProduct(payload) {
  return updateStore((store) => {
    const product = {
      id: createId("product"),
      description: "",
      imageUrl: "",
      isActive: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...payload
    };
    store.products.push(product);
    return clone(product);
  });
}

export function updateProduct(productId, payload) {
  return updateStore((store) => {
    const product = getProduct(store, productId);
    if (!product) return null;
    Object.assign(product, payload, { updatedAt: nowIso() });
    return clone(product);
  });
}

export function listUserPlans(userId) {
  const store = loadStore();
  return clone(
    store.plans
      .filter((plan) => plan.userId === userId)
      .sort((left, right) => compareDesc(left.createdAt, right.createdAt))
      .map((plan) => hydratePlan(store, plan))
  );
}

export function createPlan(userId, payload) {
  return updateStore((store) => {
    const user = getUser(store, userId);
    const product = getProduct(store, payload.productId);
    if (!user || !product) return null;

    const plan = {
      id: createId("plan"),
      userId,
      productId: payload.productId,
      startDate: normalizeDate(payload.startDate),
      endDate: normalizeDate(payload.endDate),
      mode: payload.mode,
      defaultQuantity: payload.defaultQuantity,
      status: "ACTIVE",
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    store.plans.push(plan);

    (payload.days || []).forEach((day) => {
      store.planDays.push({
        id: createId("day"),
        planId: plan.id,
        date: normalizeDate(day.date),
        quantity: day.quantity,
        addressId: day.addressId || null,
        createdAt: nowIso(),
        updatedAt: nowIso()
      });
    });

    const defaultAddress = findDefaultAddress(store, userId);
    for (
      let current = toDateOnly(payload.startDate);
      current <= toDateOnly(payload.endDate);
      current = addDays(current, 1)
    ) {
      const override = (payload.days || []).find((day) => sameDate(day.date, current));
      const quantity = payload.mode === "CUSTOM" ? Number(override?.quantity || 0) : Number(payload.defaultQuantity || 0);
      if (quantity <= 0 || !defaultAddress) continue;

      upsertDeliveryRecord(store, {
        userId,
        addressId: override?.addressId || defaultAddress.id,
        productId: payload.productId,
        planId: plan.id,
        date: current,
        quantity,
        status: "PENDING",
        note: ""
      });
    }

    return clone(hydratePlan(store, plan));
  });
}

export function updatePlan(planId, payload) {
  return updateStore((store) => {
    const plan = getPlanRecord(store, planId);
    if (!plan) return null;

    Object.assign(plan, payload, { updatedAt: nowIso() });

    if (payload.status === "CANCELLED") {
      store.deliveries.forEach((delivery) => {
        if (
          delivery.planId === planId &&
          delivery.status === "PENDING" &&
          new Date(delivery.date).getTime() >= startOfDay(new Date()).getTime()
        ) {
          delivery.status = "CANCELLED";
          delivery.updatedAt = nowIso();
        }
      });
    }

    return clone(hydratePlan(store, plan));
  });
}

export function upsertPlanDays(planId, days) {
  return updateStore((store) => {
    const plan = getPlanRecord(store, planId);
    if (!plan) return [];

    const defaultAddress = findDefaultAddress(store, plan.userId);

    const result = days.map((day) => {
      let record = store.planDays.find(
        (item) => item.planId === planId && sameDate(item.date, day.date)
      );

      if (record) {
        Object.assign(record, {
          quantity: day.quantity,
          addressId: day.addressId || record.addressId || null,
          updatedAt: nowIso()
        });
      } else {
        record = {
          id: createId("day"),
          planId,
          date: normalizeDate(day.date),
          quantity: day.quantity,
          addressId: day.addressId || null,
          createdAt: nowIso(),
          updatedAt: nowIso()
        };
        store.planDays.push(record);
      }

      const targetAddressId = day.addressId || record.addressId || defaultAddress?.id || null;
      const delivery = store.deliveries.find(
        (item) =>
          item.planId === planId &&
          item.productId === plan.productId &&
          sameDate(item.date, day.date)
      );

      if (day.quantity <= 0) {
        if (delivery) {
          delivery.quantity = 0;
          delivery.status = "CANCELLED";
          delivery.updatedAt = nowIso();
        }
      } else {
        upsertDeliveryRecord(store, {
          userId: plan.userId,
          addressId: targetAddressId,
          productId: plan.productId,
          planId,
          date: day.date,
          quantity: day.quantity,
          status: delivery?.status === "DELIVERED" ? "DELIVERED" : "PENDING",
          note: delivery?.note || ""
        });
      }

      return clone(record);
    });

    return result;
  });
}

export function createPlanPause(planId, payload) {
  return updateStore((store) => {
    const pause = {
      id: createId("pause"),
      planId,
      startDate: normalizeDate(payload.startDate),
      endDate: normalizeDate(payload.endDate),
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    store.planPauses.push(pause);
    return clone(pause);
  });
}

export function listUserDeliveries(userId) {
  const store = loadStore();
  return clone(
    store.deliveries
      .filter((delivery) => delivery.userId === userId)
      .sort((left, right) => compareDesc(left.date, right.date))
      .map((delivery) => hydrateDelivery(store, delivery))
  );
}

export function updateDelivery(deliveryId, payload) {
  return updateStore((store) => {
    const delivery = store.deliveries.find((item) => item.id === deliveryId);
    if (!delivery) return null;
    Object.assign(delivery, payload, { updatedAt: nowIso() });
    return clone(hydrateDelivery(store, delivery));
  });
}

export function listUserInvoices(userId) {
  const store = loadStore();
  return clone(
    store.invoices
      .filter((invoice) => invoice.userId === userId)
      .sort((left, right) =>
        right.year === left.year ? right.month - left.month : right.year - left.year
      )
      .map((invoice) => hydrateInvoice(store, invoice))
  );
}

export function listUserSummary(userId) {
  const store = loadStore();
  const user = getUser(store, userId);
  if (!user) return null;

  return clone({
    user,
    addresses: listAddresses(userId),
    plans: listUserPlans(userId),
    deliveries: listUserDeliveries(userId).sort((left, right) => compareAsc(left.date, right.date)),
    invoices: listUserInvoices(userId)
  });
}

export function listAdminSubscriptions(includeCancelled = false) {
  const store = loadStore();
  return clone(
    store.plans
      .filter((plan) => includeCancelled || plan.status !== "CANCELLED")
      .sort((left, right) => compareDesc(left.updatedAt, right.updatedAt))
      .map((plan) => hydratePlan(store, plan))
  );
}

export function listDailyDeliveries(date = new Date()) {
  const store = loadStore();
  const start = startOfDay(date).getTime();
  const end = endOfDay(date).getTime();

  return clone(
    store.deliveries
      .filter((delivery) => {
        const time = new Date(delivery.date).getTime();
        const plan = delivery.planId ? getPlanRecord(store, delivery.planId) : null;
        return (
          time >= start &&
          time <= end &&
          delivery.status !== "CANCELLED" &&
          (!plan || plan.status !== "CANCELLED")
        );
      })
      .sort((left, right) => compareAsc(left.createdAt, right.createdAt))
      .map((delivery) => hydrateDelivery(store, delivery))
  );
}

export function generateDeliveries(date = new Date()) {
  return updateStore((store) => {
    const targetDate = startOfDay(date);
    let created = 0;

    store.plans
      .filter((plan) => plan.status === "ACTIVE")
      .forEach((plan) => {
        if (new Date(plan.startDate) > targetDate || new Date(plan.endDate) < targetDate) {
          return;
        }

        const pauses = getPlanPauses(store, plan.id);
        const paused = pauses.some(
          (pause) =>
            targetDate >= startOfDay(pause.startDate) && targetDate <= endOfDay(pause.endDate)
        );
        if (paused) {
          return;
        }

        const override = getPlanDays(store, plan.id).find((day) => sameDate(day.date, targetDate));
        const quantity = plan.mode === "CUSTOM" ? Number(override?.quantity || 0) : Number(plan.defaultQuantity || 0);
        if (quantity <= 0) {
          return;
        }

        const address = override?.addressId
          ? getAddress(store, override.addressId)
          : findDefaultAddress(store, plan.userId);
        if (!address) {
          return;
        }

        const before = store.deliveries.length;
        upsertDeliveryRecord(store, {
          userId: plan.userId,
          addressId: address.id,
          productId: plan.productId,
          planId: plan.id,
          date: targetDate,
          quantity,
          status: "PENDING",
          note: ""
        });
        if (store.deliveries.length !== before) {
          created += 1;
        }
      });

    return { created };
  });
}

export function listAdminInvoices(month, year) {
  const store = loadStore();
  return clone(
    store.invoices
      .filter((invoice) => invoice.month === month && invoice.year === year)
      .sort((left, right) => Number(left.status > right.status))
      .map((invoice) => hydrateInvoice(store, invoice))
  );
}

export function generateInvoices(month, year) {
  return updateStore((store) => {
    const start = new Date(year, month - 1, 1).getTime();
    const end = new Date(year, month, 0, 23, 59, 59, 999).getTime();
    const totals = new Map();

    store.deliveries.forEach((delivery) => {
      const time = new Date(delivery.date).getTime();
      if (time < start || time > end || delivery.status === "CANCELLED") {
        return;
      }
      const product = getProduct(store, delivery.productId);
      if (!product) return;
      totals.set(
        delivery.userId,
        Number(totals.get(delivery.userId) || 0) + Number(delivery.quantity || 0) * Number(product.price || 0)
      );
    });

    let created = 0;
    Array.from(totals.entries()).forEach(([userId, totalAmount]) => {
      const existing = store.invoices.find(
        (invoice) => invoice.userId === userId && invoice.month === month && invoice.year === year
      );

      createInvoiceRecord(store, {
        userId,
        month,
        year,
        totalAmount,
        status: existing?.status === "PAID" ? "PAID" : "DUE"
      });

      if (!existing) {
        created += 1;
      }
    });

    return { created };
  });
}

export function createPayment(invoiceId, provider) {
  return updateStore((store) => {
    const invoice = store.invoices.find((item) => item.id === invoiceId);
    if (!invoice) return null;

    const payment = {
      id: createId("payment"),
      invoiceId,
      provider,
      amount: invoice.totalAmount,
      status: "SUCCESS",
      reference: `PAY-${invoiceId.slice(-8)}`,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    store.payments.push(payment);
    invoice.status = "PAID";
    invoice.updatedAt = nowIso();

    return clone(payment);
  });
}

export function getAdminReportsSummary() {
  const store = loadStore();
  const activePlans = store.plans.filter((plan) => plan.status === "ACTIVE");
  const today = startOfDay(new Date());
  const todayLitres = store.deliveries
    .filter((delivery) => sameDate(delivery.date, today) && delivery.status !== "CANCELLED")
    .reduce((sum, delivery) => sum + Number(delivery.quantity || 0), 0);
  const deliveredCount = store.deliveries.filter((delivery) => delivery.status === "DELIVERED").length;
  const pendingCount = store.deliveries.filter((delivery) => delivery.status === "PENDING").length;
  const totalRevenue = store.invoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);
  const paidRevenue = store.invoices
    .filter((invoice) => invoice.status === "PAID")
    .reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);
  const retained = activePlans.filter((plan) =>
    store.deliveries.some((delivery) => delivery.planId === plan.id && delivery.status === "DELIVERED")
  ).length;

  return clone({
    activeSubscribers: activePlans.length,
    dailyLitres: todayLitres,
    deliveredCount,
    pendingCount,
    retention: activePlans.length ? Math.round((retained / activePlans.length) * 100) : 0,
    totalRevenue,
    paidRevenue
  });
}
