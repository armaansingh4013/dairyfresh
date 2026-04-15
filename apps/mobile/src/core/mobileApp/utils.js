export function normalizeProducts(data) {
  const list = Array.isArray(data) ? data : [];
  return list.map((product) => ({
    ...product,
    id: product.id || product._id
  }));
}

export function buildSubscriptionGroups(plans) {
  const list = Array.isArray(plans) ? plans : [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const active = list.filter((plan) => plan.status === "ACTIVE");
  const completed = list.filter(
    (plan) => plan.status !== "CANCELLED" && new Date(plan.endDate) < today
  );

  return {
    active,
    completed
  };
}

export function filterPlanOrdersByTab(orders, tab) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (orders || []).filter((order) => {
    const orderDate = new Date(order.date);
    orderDate.setHours(0, 0, 0, 0);
    const isCompleted = order.status === "COMPLETED";

    if (tab === "today") {
      return orderDate.getTime() === today.getTime();
    }
    if (tab === "upcoming") {
      return orderDate.getTime() > today.getTime() && !isCompleted;
    }
    return isCompleted;
  });
}

export function buildDateKeys(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const keys = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    keys.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
}

export function buildCalendarCells(cursor) {
  const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const cells = [];

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const value = new Date(cursor.getFullYear(), cursor.getMonth(), day);
    cells.push({
      day,
      key: formatDateKey(value)
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function computeOrderTotal(order) {
  return (order.items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.product?.price || 0),
    0
  );
}

export function sanitizeAddress(form) {
  return {
    title: form.title.trim(),
    recipientName: form.recipientName.trim(),
    recipientPhone: form.recipientPhone.trim(),
    houseNumber: form.houseNumber.trim(),
    line1: form.line1.trim(),
    line2: form.line2.trim(),
    landmark: form.landmark.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    postalCode: form.postalCode.trim(),
    lat: typeof form.lat === "number" ? form.lat : null,
    lng: typeof form.lng === "number" ? form.lng : null
  };
}

export function formatAddress(address) {
  return [
    address.houseNumber,
    address.line1,
    address.line2,
    address.landmark,
    address.city,
    address.state,
    address.postalCode
  ]
    .filter(Boolean)
    .join(", ");
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString();
}

export function formatDateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export function formatCoordinates(address) {
  if (typeof address?.lat !== "number" || typeof address?.lng !== "number") {
    return "Pin not set";
  }

  return `${address.lat.toFixed(6)}, ${address.lng.toFixed(6)}`;
}
