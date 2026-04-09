import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiGet, apiPatch, apiPost } from "../../services/api.js";
import { datesBetween, toDateString } from "../../utils/date.js";

const DETAIL_TABS = {
  TODAY: "today",
  UPCOMING: "upcoming",
  COMPLETED: "completed"
};

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatOrderDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function buildCalendar(startDate, endDate, overrides, defaultQty) {
  const days = datesBetween(startDate, endDate);
  return days.map((date) => {
    const key = toDateString(date);
    const override = overrides[key];
    const quantity = override ?? defaultQty;
    return { date, key, quantity };
  });
}

export default function SubscriptionDetailPage({ user }) {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [plan, setPlan] = useState(null);
  const [planOrders, setPlanOrders] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [status, setStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedQty, setSelectedQty] = useState(0);
  const currentTab = searchParams.get("tab") || DETAIL_TABS.TODAY;

  useEffect(() => {
    loadPlan();
  }, [planId, user.id]);

  async function loadPlan() {
    try {
      const [plansData, planOrdersData] = await Promise.all([
        apiGet(`/users/${user.id}/plans`),
        apiGet(`/orders/plan/${planId}`)
      ]);
      const list = Array.isArray(plansData) ? plansData : [];
      const found = list.find((item) => item.id === planId);

      if (!found) {
        setPlan(null);
        setPlanOrders([]);
        return;
      }

      const days = found.days || {};
      const map = Object.fromEntries(
        Object.entries(days).map(([key, day]) => [key, Number(day?.quantity || 0)])
      );

      setOverrides(map);
      setPlan(found);
      setPlanOrders(Array.isArray(planOrdersData) ? planOrdersData : []);
    } catch {
      setPlan(null);
      setPlanOrders([]);
    }
  }

  const calendar = useMemo(() => {
    if (!plan) return [];
    const baseQty = plan.mode === "CUSTOM" ? 0 : plan.defaultQuantity;
    return buildCalendar(plan.startDate, plan.endDate, overrides, baseQty);
  }, [plan, overrides]);

  const orderMeta = {
    [DETAIL_TABS.TODAY]: {
      label: "Today's Orders",
      empty: "No delivery scheduled for today."
    },
    [DETAIL_TABS.UPCOMING]: {
      label: "Upcoming Orders",
      empty: "No upcoming deliveries scheduled."
    },
    [DETAIL_TABS.COMPLETED]: {
      label: "Completed Orders",
      empty: "No completed deliveries yet."
    }
  };

  const orderSections = useMemo(() => {
    if (!planOrders.length) {
      return {
        [DETAIL_TABS.TODAY]: [],
        [DETAIL_TABS.UPCOMING]: [],
        [DETAIL_TABS.COMPLETED]: []
      };
    }

    const today = startOfDay(new Date());
    const items = planOrders.map((order) => {
      const itemDate = startOfDay(order.date);
      const primaryItem = order.items?.[0] || null;

      return {
        key: order.id,
        date: order.date,
        dateValue: itemDate.getTime(),
        dateLabel: formatOrderDate(order.date),
        quantity: Number(primaryItem?.quantity || 0),
        status: order.status || "PLACED"
      };
    });

    return {
      [DETAIL_TABS.TODAY]: items.filter(
        (item) =>
          item.dateValue === today.getTime() &&
          item.status !== "DELIVERED" &&
          item.status !== "COMPLETED"
      ),
      [DETAIL_TABS.UPCOMING]: items.filter(
        (item) =>
          item.dateValue > today.getTime() &&
          item.status !== "DELIVERED" &&
          item.status !== "COMPLETED"
      ),
      [DETAIL_TABS.COMPLETED]: items.filter(
        (item) =>
          item.status === "DELIVERED" ||
          item.status === "COMPLETED" ||
          item.dateValue < today.getTime()
      )
    };
  }, [planOrders]);

  const visibleOrders = orderSections[currentTab] || orderSections[DETAIL_TABS.TODAY];

  function toggleDate(dateKey) {
    if (!plan) return;
    setOverrides((current) => {
      const baseQty = plan.mode === "CUSTOM" ? 0 : plan.defaultQuantity;
      const currentQty = current[dateKey] ?? baseQty;
      const nextQty = currentQty === 0 ? baseQty || 1 : 0;
      return { ...current, [dateKey]: nextQty };
    });
  }

  function openQuantityEditor(dateKey) {
    if (!plan) return;
    const baseQty = plan.mode === "CUSTOM" ? 0 : plan.defaultQuantity;
    const qty = overrides[dateKey] ?? baseQty;
    setSelectedDate(dateKey);
    setSelectedQty(qty);
  }

  function applyQuantity() {
    if (!selectedDate) return;
    setOverrides((current) => ({ ...current, [selectedDate]: Number(selectedQty) || 0 }));
    setSelectedDate(null);
  }

  async function saveChanges() {
    if (!plan) return;
    setStatus("");
    const baseQty = plan.mode === "CUSTOM" ? 0 : plan.defaultQuantity;
    const daysPayload = calendar.map((item) => ({
      date: item.key,
      quantity: overrides[item.key] ?? baseQty
    }));

    try {
      await apiPost(`/plans/${plan.id}/days`, { days: daysPayload });
      setStatus("Subscription updated.");
      loadPlan();
    } catch {
      setStatus("Unable to update subscription.");
    }
  }

  async function cancelSubscription() {
    if (!plan) return;
    setStatus("");
    try {
      await apiPatch(`/plans/${plan.id}`, { status: "CANCELLED" });
      setStatus("Subscription cancelled.");
      navigate("/app/subscriptions");
    } catch {
      setStatus("Unable to cancel subscription.");
    }
  }

  if (!plan) {
    return (
      <section className="section-card">
        <p className="section-kicker">Subscription</p>
        <h2>Subscription not found</h2>
      </section>
    );
  }

  return (
    <section className="section-card">
      <p className="section-kicker">Subscription</p>
      <h2>{plan.product?.name || "Product"}</h2>
      <p>
        {toDateString(plan.startDate)} to {toDateString(plan.endDate)}
      </p>
      <p>
        {plan.address
          ? `${plan.address.houseNumber}, ${plan.address.line1}, ${plan.address.city}, ${plan.address.state}, ${plan.address.postalCode}`
          : "No delivery address set"}
      </p>
      <p>Default quantity: {plan.defaultQuantity}</p>

      <section className="detail-panel subscription-orders-panel">
        <div className="summary-row">
          <div>
            <strong>Subscription Orders</strong>
            <p className="message">{orderMeta[currentTab]?.label || orderMeta[DETAIL_TABS.TODAY].label}</p>
          </div>
        </div>

        <div className="mode-toggle subscriptions-tabs">
          {Object.values(DETAIL_TABS).map((tab) => (
            <button
              key={tab}
              type="button"
              className={currentTab === tab ? "toggle active" : "toggle"}
              onClick={() => setSearchParams(tab === DETAIL_TABS.TODAY ? {} : { tab })}
            >
              {orderMeta[tab].label}
            </button>
          ))}
        </div>

        {visibleOrders.length ? (
          <div className="saved-orders">
            {visibleOrders.map((item) => (
              <article key={item.key} className="plan-card">
                <div className="summary-row">
                  <div>
                    <strong>{plan.product?.name || "Product"}</strong>
                    <p>{item.dateLabel}</p>
                  </div>
                  <span className="badge">{item.status}</span>
                </div>
                <div className="history-metrics">
                  <span>Quantity: {item.quantity}</span>
                  <span>Mode: {plan.mode}</span>
                  <span>{currentTab === DETAIL_TABS.COMPLETED ? "Delivered" : "Scheduled"}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">{orderMeta[currentTab]?.empty}</p>
        )}
      </section>

      {/* <div className="calendar">
        {calendar.map((item) => (
          <button
            key={item.key}
            type="button"
            className={item.quantity === 0 ? "cal-day off" : "cal-day"}
            onClick={() => toggleDate(item.key)}
            onDoubleClick={() => openQuantityEditor(item.key)}
            title="Click to toggle. Double click to edit quantity."
          >
            <span>{new Date(item.date).getDate()}</span>
            <span className="dot" />
            <small>{item.quantity === 0 ? "Off" : `Qty ${item.quantity}`}</small>
          </button>
        ))}
      </div> */}

      {/* {selectedDate ? (
        <div className="quantity-editor">
          <p>Set quantity for {selectedDate}</p>
          <input
            type="number"
            min="0"
            value={selectedQty}
            onChange={(event) => setSelectedQty(event.target.value)}
          />
          <button className="primary" type="button" onClick={applyQuantity}>
            Save Quantity
          </button>
        </div>
      ) : null} */}
{/* 
      <div className="cta-row">
        <button className="primary" type="button" onClick={saveChanges}>
          Save Changes
        </button>
        <button className="ghost" type="button" onClick={cancelSubscription}>
          Cancel Subscription
        </button>
      </div> */}
      {/* {status ? <p className="message">{status}</p> : null}
      <p className="empty-state">Tip: Click a date to skip, double click to set quantity.</p> */}
    </section>
  );
}
