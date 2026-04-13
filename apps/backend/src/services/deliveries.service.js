import { Delivery, Plan, Product, User } from "../models/index.js";
import { addDays, endOfDay, sameDate, startOfDay, toDateKey, toDateOnly } from "../utils/date.js";

function getDefaultAddress(user) {
  return user?.addresses?.find((address) => address.isDefault) || user?.addresses?.[0] || null;
}

async function getDefaultDeliveryPersonId() {
  const deliveryUser = await User.findOne({ role: "DELIVERY" }).select("_id").lean();
  return deliveryUser?._id || null;
}

export async function hydrateDelivery(deliveryDoc, options = {}) {
  const { includePlan = true } = options;
  if (!deliveryDoc) return null;

  const delivery = await Delivery.findById(deliveryDoc._id)
    .populate("userId")
    .populate("productId");

  if (!delivery) return null;

  if (includePlan) {
    await delivery.populate("planId");
  }

  const user = delivery.userId;
  const address =
    user && delivery.addressId ? user.addresses.id(delivery.addressId) || null : null;

  return {
    id: delivery._id.toString(),
    userId: delivery.userId?._id?.toString(),
    planId: delivery.planId?._id?.toString?.() || delivery.planId?.toString?.() || null,
    productId: delivery.productId?._id?.toString(),
    addressId: delivery.addressId?.toString?.() || null,
    date: delivery.date,
    quantity: delivery.quantity,
    status: delivery.status,
    note: delivery.note,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt,
    user,
    product: delivery.productId,
    ...(includePlan ? { plan: delivery.planId } : {}),
    address: address
      ? {
          id: address._id.toString(),
          userId: user._id.toString(),
          title: address.title,
          houseNumber: address.houseNumber,
          line1: address.line1,
          line2: address.line2,
          landmark: address.landmark,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          lat: address.lat,
          lng: address.lng,
          isDefault: address.isDefault
        }
      : null
  };
}

export async function upsertDeliveryRecord(payload) {
  const day = toDateOnly(payload.date);
  const nextDay = addDays(day, 1);
  const resolvedDeliveryPersonId =
    payload.deliveryPersonId === undefined
      ? await getDefaultDeliveryPersonId()
      : payload.deliveryPersonId;

  let delivery = await Delivery.findOne({
    userId: payload.userId,
    productId: payload.productId,
    date: { $gte: day, $lt: nextDay }
  });

  if (delivery) {
    Object.assign(delivery, {
      addressId: payload.addressId,
      planId: payload.planId || null,
      deliveryPersonId:
        payload.deliveryPersonId !== undefined
          ? resolvedDeliveryPersonId
          : delivery.deliveryPersonId || resolvedDeliveryPersonId || null,
      date: day,
      quantity: payload.quantity,
      status: payload.status || delivery.status,
      note: payload.note ?? delivery.note ?? ""
    });
    await delivery.save();
    return delivery;
  }

  return Delivery.create({
    userId: payload.userId,
    deliveryPersonId: resolvedDeliveryPersonId,
    addressId: payload.addressId,
    productId: payload.productId,
    planId: payload.planId || null,
    date: day,
    quantity: payload.quantity,
    status: payload.status || "PENDING",
    note: payload.note ?? ""
  });
}

function formatAssignedAddress(address) {
  if (!address) return null;

  return {
    id: address._id.toString(),
    line1: address.line1 || "",
    city: address.city || "",
    postalCode: address.postalCode || "",
    landmark: address.landmark || ""
  };
}

export async function listDeliveriesForDeliveryPerson(deliveryPersonId, status = "PENDING") {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());

  const deliveries = await Delivery.find({
    deliveryPersonId,
    date: { $gte: start, $lte: end },
    status: status === "DELIVERED" ? "DELIVERED" : { $in: ["PENDING", "MISSED"] }
  })
    .sort({ date: 1, createdAt: 1 })
    .populate("userId", "name phone addresses")
    .populate("productId", "name unit price")
    .lean();

  return deliveries.map((delivery) => {
    const address =
      delivery.userId?.addresses?.find(
        (entry) => String(entry._id) === String(delivery.addressId || "")
      ) || null;
    const quantity = Number(delivery.quantity || 0);
    const unitPrice = Number(delivery.productId?.price || 0);

    return {
      id: delivery._id.toString(),
      date: delivery.date,
      status: delivery.status,
      quantity,
      amountToCollect: Number((quantity * unitPrice).toFixed(2)),
      customer: {
        id: delivery.userId?._id?.toString?.() || null,
        name: delivery.userId?.name || "Customer",
        phone: delivery.userId?.phone || ""
      },
      product: {
        id: delivery.productId?._id?.toString?.() || null,
        name: delivery.productId?.name || "Product",
        unit: delivery.productId?.unit || "",
        price: unitPrice
      },
      address: formatAssignedAddress(address)
    };
  });
}

export async function markDeliveryDeliveredForPerson(deliveryId, deliveryPersonId) {
  const delivery = await Delivery.findOne({
    _id: deliveryId,
    deliveryPersonId
  });

  if (!delivery) return null;

  return updateDelivery(deliveryId, { status: "DELIVERED" });
}

export async function recalculatePlanStats(planId) {
  const deliveries = await Delivery.find({ planId });
  const totalDeliveries = deliveries.filter((d) => d.status !== "CANCELLED").length;
  const completedDeliveries = deliveries.filter((d) => d.status === "DELIVERED").length;

  await Plan.findByIdAndUpdate(planId, {
    totalDeliveries,
    completedDeliveries
  });
}

export async function listUserDeliveries(userId) {
  const deliveries = await Delivery.find({ userId }).sort({ date: -1 });
  return Promise.all(deliveries.map((delivery) => hydrateDelivery(delivery)));
}

export async function updateDelivery(deliveryId, payload) {
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) return null;

  Object.assign(delivery, payload);
  await delivery.save();

  if (delivery.planId) {
    const plan = await Plan.findById(delivery.planId);
    if (plan) {
      const key = toDateKey(delivery.date);
      const existingDay = plan.days.get(key);
      if (existingDay) {
        existingDay.status = delivery.status === "CANCELLED" ? "SKIPPED" : delivery.status;
        existingDay.delivered = delivery.status === "DELIVERED" ? 1 : 0;
        plan.days.set(key, existingDay);
        await plan.save();
      }
      await recalculatePlanStats(plan._id);
    }
  }

  return hydrateDelivery(delivery);
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
  const targetKey = toDateKey(targetDate);

  const plans = await Plan.find({ status: "ACTIVE" }).populate("userId");
  let created = 0;

  for (const plan of plans) {
    if (new Date(plan.startDate) > targetDate || new Date(plan.endDate) < targetDate) {
      continue;
    }

    const override = plan.days.get(targetKey);
    const quantity =
      plan.mode === "CUSTOM"
        ? Number(override?.quantity || 0)
        : Number(override?.quantity ? plan.defaultQuantity : 0);

    if (quantity <= 0) continue;
    if (override?.status === "SKIPPED") continue;

    const user = plan.userId;
    const addressId = override?.addressId || getDefaultAddress(user)?._id || null;
    if (!addressId) continue;

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
      status: override?.status === "DELIVERED" ? "DELIVERED" : "PENDING",
      note: ""
    });

    if (!existing) created += 1;
  }

  return { created };
}
