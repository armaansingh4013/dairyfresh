import { Order, Product, User, Plan } from "../models/index.js";
import { endOfDay, startOfDay, toDateOnly, toDateKey } from "../utils/date.js";

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

export async function listPlanOrders(planId) {
  const orders = await Order.find({ planId }).sort({ createdAt: -1 });
  return Promise.all(orders.map((order) => hydrateOrder(order)));
}

export async function updateOrderStatus(orderId, status) {
  const order = await Order.findById(orderId);
  if (!order) return null;

  order.status = status;
  await order.save();

  return hydrateOrder(order);
}

export async function scheduleTodaysPlacedOrders(date = new Date()) {
  const start = startOfDay(date);
  const end = endOfDay(date);

  const result = await Order.updateMany(
    {
      date: { $gte: start, $lte: end },
      status: "PLACED"
    },
    {
      $set: { status: "SCHEDULED" }
    }
  );

  return {
    dateKey: toDateKey(date),
    matchedCount: Number(result.matchedCount || 0),
    modifiedCount: Number(result.modifiedCount || 0)
  };
}


export async function listTodaysOrders(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const orders = await Order.find({
    date: { $gte: start, $lte: end },
    status: { $ne: "CANCELLED" }
  })
    .sort({ createdAt: -1 })
    .select("userId addressId type planId date status items createdAt")
    .populate({
      path: "userId",
      select: "name phone addresses"
    })
    .populate({
      path: "items.productId",
      select: "name unit price"
    });

  return orders.map((order) => {
    const address =
      order.userId?.addresses?.find(
        (entry) => String(entry._id) === String(order.addressId || "")
      ) || null;
    const items = (order.items || []).map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.productId?.price || 0);

      return {
        productId: item.productId?._id?.toString?.() || null,
        name: item.productId?.name || "Product",
        unit: item.productId?.unit || "",
        quantity,
        unitPrice,
        lineTotal: Number((quantity * unitPrice).toFixed(2))
      };
    });

    return {
      id: order._id.toString(),
      type: order.type,
      status: order.status,
      date: order.date,
      createdAt: order.createdAt,
      customer: {
        id: order.userId?._id?.toString?.() || null,
        name: order.userId?.name || "",
        phone: order.userId?.phone || ""
      },
      address: address
        ? {
            id: address._id.toString(),
            line1: address.line1 || "",
            city: address.city || ""
          }
        : null,
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)),
      items
    };
  });
}
