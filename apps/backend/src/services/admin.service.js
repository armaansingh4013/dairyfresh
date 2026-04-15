import { Delivery, Invoice, Order, Plan, User } from "../models/index.js";
import { addDays, endOfDay, sameDate, startOfDay } from "../utils/date.js";
import { notFound } from "../utils/response.js";

function formatAddress(address) {
  if (!address) return null;

  return {
    id: address._id?.toString?.() || null,
    title: address.title || "",
    houseNumber: address.houseNumber || "",
    line1: address.line1 || "",
    line2: address.line2 || "",
    landmark: address.landmark || "",
    city: address.city || "",
    state: address.state || "",
    postalCode: address.postalCode || ""
  };
}

function getAddressById(user, addressId) {
  if (!user?.addresses?.length || !addressId) return null;
  const targetId = String(addressId);
  return user.addresses.find((address) => String(address._id) === targetId) || null;
}

function mapUserSummary(user) {
  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name || "",
    phone: user.phone || "",
    email: user.email || ""
  };
}

function mapProductSummary(product) {
  if (!product) return null;

  return {
    id: product._id.toString(),
    name: product.name || "",
    unit: product.unit || "",
    price: Number(product.price || 0)
  };
}

function mapPlanSummary(plan) {
  const address = getAddressById(plan.userId, plan.addressId);

  return {
    id: plan._id.toString(),
    mode: plan.mode,
    status: plan.status,
    defaultQuantity: Number(plan.defaultQuantity || 0),
    startDate: plan.startDate,
    endDate: plan.endDate,
    totalDeliveries: Number(plan.totalDeliveries || 0),
    completedDeliveries: Number(plan.completedDeliveries || 0),
    user: mapUserSummary(plan.userId),
    product: mapProductSummary(plan.productId),
    address: formatAddress(address)
  };
}

function mapOrderSummary(order) {
  const address = getAddressById(order.userId, order.addressId);
  const items = (order.items || []).map((item) => {
    const unitPrice = Number(item.productId?.price || 0);
    const quantity = Number(item.quantity || 0);

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
    address: formatAddress(address),
    itemCount: items.length,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)),
    items
  };
}

export async function listAdminDailyDeliveries(date = new Date()) {
  const start = startOfDay(date);
  const end = endOfDay(date);

  const orders = await Order.find({
    date: { $gte: start, $lte: end },
    status: { $ne: "CANCELLED" }
  })
    .sort({ createdAt: -1 })
    .select("userId addressId type planId date status items createdAt")
    .populate({
      path: "userId",
      select: "name phone email addresses"
    })
    .populate({
      path: "planId",
      select: "startDate endDate status"
    })
    .populate({
      path: "items.productId",
      select: "name unit price"
    })
    .lean();

  return orders.map((order) => {
    const mappedOrder = mapOrderSummary(order);

    return {
      ...mappedOrder,
      customer: mapUserSummary(order.userId),
      plan:
        order.planId && order.planId.status !== "CANCELLED"
          ? {
              id: order.planId._id.toString(),
              startDate: order.planId.startDate,
              endDate: order.planId.endDate,
              status: order.planId.status
            }
          : null
    };
  });
}

export async function listAdminOrders(scope = "today", date = new Date()) {
  const todayStart = startOfDay(date);
  const todayEnd = endOfDay(date);
  const tomorrowStart = startOfDay(addDays(todayStart, 1));

  const filter = {};

  if (scope === "completed") {
    filter.status = "COMPLETED";
  } else if (scope === "upcoming") {
    filter.date = { $gte: tomorrowStart };
    filter.status = { $nin: ["CANCELLED", "COMPLETED"] };
  } else {
    filter.date = { $gte: todayStart, $lte: todayEnd };
    filter.status = { $ne: "CANCELLED" };
  }

  const orders = await Order.find(filter)
    .sort(scope === "completed" ? { date: -1, createdAt: -1 } : { date: 1, createdAt: 1 })
    .select("userId addressId type planId date status items createdAt")
    .populate({
      path: "userId",
      select: "name phone email addresses"
    })
    .populate({
      path: "planId",
      select: "startDate endDate status"
    })
    .populate({
      path: "items.productId",
      select: "name unit price"
    })
    .lean();

  return orders
    .filter((order) => !order.planId || order.planId.status !== "CANCELLED")
    .map((order) => {
      const mappedOrder = mapOrderSummary(order);

      return {
        ...mappedOrder,
        customer: mapUserSummary(order.userId),
        plan:
          order.planId && order.planId.status !== "CANCELLED"
            ? {
                id: order.planId._id.toString(),
                startDate: order.planId.startDate,
                endDate: order.planId.endDate,
                status: order.planId.status
              }
            : null
      };
    });
}

function mapDeliverySummary(delivery) {
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
      phone: delivery.userId?.phone || "",
      email: delivery.userId?.email || ""
    },
    product: {
      id: delivery.productId?._id?.toString?.() || null,
      name: delivery.productId?.name || "Product",
      unit: delivery.productId?.unit || "",
      price: unitPrice
    },
    address: formatAddress(address),
    plan: delivery.planId
      ? {
          id: delivery.planId?._id?.toString?.() || null,
          status: delivery.planId?.status || null,
          startDate: delivery.planId?.startDate || null,
          endDate: delivery.planId?.endDate || null
        }
      : null
  };
}

export async function listAdminDeliveries(scope = "today", date = new Date()) {
  const todayStart = startOfDay(date);
  const todayEnd = endOfDay(date);
  const tomorrowStart = startOfDay(addDays(todayStart, 1));

  const filter = {};

  if (scope === "completed") {
    filter.status = "DELIVERED";
  } else if (scope === "upcoming") {
    filter.date = { $gte: tomorrowStart };
    filter.status = { $nin: ["CANCELLED", "DELIVERED"] };
  } else {
    filter.date = { $gte: todayStart, $lte: todayEnd };
    filter.status = { $ne: "CANCELLED" };
  }

  const deliveries = await Delivery.find(filter)
    .sort(scope === "completed" ? { date: -1, createdAt: -1 } : { date: 1, createdAt: 1 })
    .populate("userId", "name phone email addresses")
    .populate("productId", "name unit price")
    .populate("planId", "startDate endDate status")
    .lean();

  return deliveries
    .filter((delivery) => !delivery.planId || delivery.planId.status !== "CANCELLED")
    .map((delivery) => mapDeliverySummary(delivery));
}

export async function listAdminSubscriptions(includeCancelled = false) {
  const filter = includeCancelled ? {} : { status: { $ne: "CANCELLED" } };
  const plans = await Plan.find(filter)
    .sort({ updatedAt: -1 })
    .select(
      "userId productId addressId mode startDate endDate defaultQuantity status totalDeliveries completedDeliveries"
    )
    .populate({
      path: "userId",
      select: "name phone email addresses"
    })
    .populate({
      path: "productId",
      select: "name unit price"
    })
    .lean();

  return plans
    .filter((plan) => plan.userId && plan.productId)
    .map((plan) => mapPlanSummary(plan));
}

export async function listAdminCustomers() {
  const [users, planStatsList, orderStatsList] = await Promise.all([
    User.find({ role: "CUSTOMER" })
      .sort({ createdAt: -1 })
      .select("name phone email createdAt")
      .lean(),
    Plan.aggregate([
      {
        $group: {
          _id: "$userId",
          totalPlans: { $sum: 1 },
          activePlans: {
            $sum: {
              $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0]
            }
          }
        }
      }
    ]),
    Order.aggregate([
      {
        $group: {
          _id: "$userId",
          totalOrders: { $sum: 1 },
          lastOrderDate: { $max: "$date" }
        }
      }
    ])
  ]);

  const planStats = new Map(
    planStatsList.map((entry) => [
      String(entry._id),
      {
        totalPlans: Number(entry.totalPlans || 0),
        activePlans: Number(entry.activePlans || 0)
      }
    ])
  );

  const orderStats = new Map(
    orderStatsList.map((entry) => [
      String(entry._id),
      {
        totalOrders: Number(entry.totalOrders || 0),
        lastOrderDate: entry.lastOrderDate || null
      }
    ])
  );

  return users.map((user) => {
    const planInfo = planStats.get(String(user._id)) || { totalPlans: 0, activePlans: 0 };
    const orderInfo = orderStats.get(String(user._id)) || {
      totalOrders: 0,
      lastOrderDate: null
    };

    return {
      id: user._id.toString(),
      name: user.name || "",
      phone: user.phone || "",
      email: user.email || "",
      joinedAt: user.createdAt,
      activePlans: planInfo.activePlans,
      totalPlans: planInfo.totalPlans,
      totalOrders: orderInfo.totalOrders,
      lastOrderDate: orderInfo.lastOrderDate
    };
  });
}

export async function getAdminCustomerDetail(customerId) {
  const user = await User.findById(customerId)
    .select("name phone email addresses createdAt")
    .lean();
  if (!user) throw notFound("Customer not found");

  const [plans, orders] = await Promise.all([
    Plan.find({ userId: customerId })
      .sort({ updatedAt: -1 })
      .select(
        "userId productId addressId mode startDate endDate defaultQuantity status totalDeliveries completedDeliveries"
      )
      .populate({
        path: "userId",
        select: "name phone email addresses"
      })
      .populate({
        path: "productId",
        select: "name unit price"
      })
      .lean(),
    Order.find({ userId: customerId })
      .sort({ date: -1, createdAt: -1 })
      .select("userId addressId type planId date status items createdAt")
      .populate({
        path: "userId",
        select: "name phone email addresses"
      })
      .populate({
        path: "items.productId",
        select: "name unit price"
      })
      .lean()
  ]);

  return {
    customer: {
      id: user._id.toString(),
      name: user.name || "",
      phone: user.phone || "",
      email: user.email || "",
      joinedAt: user.createdAt,
      addresses: (user.addresses || []).map((address) => formatAddress(address))
    },
    plans: plans
      .filter((plan) => plan.userId && plan.productId)
      .map((plan) => mapPlanSummary(plan)),
    orders: orders.map((order) => mapOrderSummary(order))
  };
}

export async function getAdminSubscriptionDetail(planId) {
  const plan = await Plan.findById(planId)
    .select(
      "userId productId addressId mode startDate endDate defaultQuantity status totalDeliveries completedDeliveries createdAt"
    )
    .populate({
      path: "userId",
      select: "name phone email addresses createdAt"
    })
    .populate({
      path: "productId",
      select: "name unit price"
    })
    .lean();

  if (!plan || !plan.userId || !plan.productId) {
    throw notFound("Subscription not found");
  }

  const orders = await Order.find({ planId })
    .sort({ date: -1, createdAt: -1 })
    .select("userId addressId type planId date status items createdAt")
    .populate({
      path: "userId",
      select: "name phone email addresses"
    })
    .populate({
      path: "items.productId",
      select: "name unit price"
    })
    .lean();

  return {
    plan: mapPlanSummary(plan),
    customer: {
      ...mapUserSummary(plan.userId),
      joinedAt: plan.userId.createdAt || null,
      addresses: (plan.userId.addresses || []).map((address) => formatAddress(address))
    },
    orders: orders.map((order) => mapOrderSummary(order))
  };
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
