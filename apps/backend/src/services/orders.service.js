import { Order, Product, User, Plan } from "../models/index.js";
import { toDateOnly } from "../utils/date.js";

async function validateAddress(user, addressId) {
  return user.addresses.id(addressId) || null;
}

export async function hydrateOrder(orderDoc) {
  if (!orderDoc) return null;

  const order = await Order.findById(orderDoc._id)
    .populate("userId")
    .populate("items.productId")
    .populate("planId");

  if (!order) return null;

  const user = order.userId;
  const address = user?.addresses?.id(order.addressId) || null;

  return {
    id: order._id.toString(),
    userId: order.userId?._id?.toString(),
    addressId: order.addressId?.toString(),
    type: order.type,
    planId: order.planId?._id?.toString?.() || null,
    date: order.date,
    status: order.status,
    note: order.note,
    source: order.source,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    user,
    plan: order.planId || null,
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
      : null,
    items: order.items.map((item) => ({
      productId: item.productId?._id?.toString?.() || item.productId?.toString?.(),
      quantity: item.quantity,
      product: item.productId
    }))
  };
}

export async function createOrder(payload) {
  const user = await User.findById(payload.userId);
  if (!user) return null;

  const address = await validateAddress(user, payload.addressId);
  if (!address) {
    const error = new Error("Address not found for user");
    error.status = 400;
    throw error;
  }

  for (const item of payload.items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive) {
      const error = new Error(`Invalid product: ${item.productId}`);
      error.status = 400;
      throw error;
    }
  }

  const order = await Order.create({
    userId: payload.userId,
    addressId: payload.addressId,
    type: "NORMAL",
    date: toDateOnly(payload.date),
    items: payload.items,
    note: payload.note || "",
    status: "PLACED",
    source: "APP"
  });

  return hydrateOrder(order);
}

export async function createPlanOrder({ userId, addressId, planId, date, items, note = "" }) {
  const user = await User.findById(userId);
  if (!user) return null;

  const address = await validateAddress(user, addressId);
  if (!address) return null;

  const plan = await Plan.findById(planId);
  if (!plan) return null;

  const order = await Order.create({
    userId,
    addressId,
    type: "PLAN",
    planId,
    date: toDateOnly(date),
    items,
    note,
    status: "PLACED",
    source: "APP"
  });

  return hydrateOrder(order);
}

export async function listUserOrders(userId) {
  const orders = await Order.find({ userId }).sort({ createdAt: -1 });
  return Promise.all(orders.map((order) => hydrateOrder(order)));
}