import React from "react";
import { Link, NavLink } from "react-router-dom";
import { apiGet } from "../../services/api.js";
import { toDateString } from "../../utils/date.js";

export async function loadUserPlans(userId) {
  const data = await apiGet(`/users/${userId}/plans`);
  return Array.isArray(data) ? data : [];
}

export function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function isCompletedPlan(plan) {
  if (plan.status === "CANCELLED") return false;
  return new Date(plan.endDate) < getTodayStart();
}

export function formatDeliveryDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export function buildDeliveredHistory(plans) {
  const deliveredItems = plans.flatMap((plan) =>
    (plan.deliveries || [])
      .filter((delivery) => delivery.status === "DELIVERED")
      .map((delivery) => ({
        id: delivery.id,
        date: delivery.date,
        dateLabel: formatDeliveryDate(delivery.date),
        productName: delivery.product?.name || plan.product?.name || "Product",
        quantity: delivery.quantity,
        unit: delivery.product?.unit || plan.product?.unit || "L",
        address: delivery.address
          ? `${delivery.address.line1}, ${delivery.address.city}`
          : null,
        planMode: plan.mode
      }))
  );

  const groups = deliveredItems.reduce((acc, item) => {
    const key = new Date(item.date).toISOString().slice(0, 10);
    if (!acc[key]) {
      acc[key] = {
        key,
        label: item.dateLabel,
        items: []
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {});

  return Object.values(groups)
    .sort((a, b) => new Date(b.key) - new Date(a.key))
    .map((group) => ({
      ...group,
      items: group.items.sort((a, b) => a.productName.localeCompare(b.productName))
    }));
}

export function SubscriptionPageNav() {
  return (
    <div className="mode-toggle subscriptions-tabs">
      <NavLink
        end
        className={({ isActive }) => (isActive ? "toggle active" : "toggle")}
        to="/app/subscriptions"
      >
        Active
      </NavLink>
      <NavLink
        className={({ isActive }) => (isActive ? "toggle active" : "toggle")}
        to="/app/subscriptions/cancelled"
      >
        Cancelled
      </NavLink>
      <NavLink
        className={({ isActive }) => (isActive ? "toggle active" : "toggle")}
        to="/app/subscriptions/completed"
      >
        Completed
      </NavLink>
      <NavLink
        className={({ isActive }) => (isActive ? "toggle active" : "toggle")}
        to="/app/subscriptions/history"
      >
        Order History
      </NavLink>
    </div>
  );
}

export function PlanCard({ plan, showEdit = false }) {
  const deliveredCount = (plan.deliveries || []).filter(
    (delivery) => delivery.status === "DELIVERED"
  ).length;

  return (
    <div className="plan-card">
      <div>
        <strong>{plan.product?.name || "Product"}</strong>
        <p>
          {toDateString(plan.startDate)} to {toDateString(plan.endDate)}
        </p>
        <p>Mode: {plan.mode}</p>
        <p>Status: {plan.status}</p>
        <p>Delivered orders: {deliveredCount}</p>
      </div>
      {showEdit ? (
        <Link className="ghost" to={`/app/subscriptions/${plan.id}`}>
          Edit Subscription
        </Link>
      ) : null}
    </div>
  );
}
