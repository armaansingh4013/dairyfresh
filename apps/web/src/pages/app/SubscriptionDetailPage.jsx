import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPatch, apiPost } from "../../services/api.js";
import { datesBetween, toDateString } from "../../utils/date.js";

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
  const [plan, setPlan] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [status, setStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedQty, setSelectedQty] = useState(0);

  useEffect(() => {
    loadPlan();
  }, [planId, user.id]);

  async function loadPlan() {
    try {
      const data = await apiGet(`/users/${user.id}/plans`);
      const list = Array.isArray(data) ? data : [];
      const found = list.find((item) => item.id === planId);
      if (!found) {
        setPlan(null);
        return;
      }
      const map = {};
      if (found.days?.length) {
        found.days.forEach((day) => {
          map[toDateString(day.date)] = day.quantity;
        });
      }
      setOverrides(map);
      setPlan(found);
    } catch {
      setPlan(null);
    }
  }

  const calendar = useMemo(() => {
    if (!plan) return [];
    const baseQty = plan.mode === "CUSTOM" ? 0 : plan.defaultQuantity;
    return buildCalendar(plan.startDate, plan.endDate, overrides, baseQty);
  }, [plan, overrides]);

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
      <p>Default quantity: {plan.defaultQuantity}</p>

      <div className="calendar">
        {calendar.map((item) => (
          <button
            key={item.key}
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
      </div>

      {selectedDate && (
        <div className="quantity-editor">
          <p>Set quantity for {selectedDate}</p>
          <input
            type="number"
            min="0"
            value={selectedQty}
            onChange={(e) => setSelectedQty(e.target.value)}
          />
          <button className="primary" onClick={applyQuantity}>
            Save Quantity
          </button>
        </div>
      )}

      <div className="cta-row">
        <button className="primary" onClick={saveChanges}>
          Save Changes
        </button>
        <button className="ghost" onClick={cancelSubscription}>
          Cancel Subscription
        </button>
      </div>
      {status && <p className="message">{status}</p>}
      <p className="empty-state">Tip: Click a date to skip, double click to set quantity.</p>
    </section>
  );
}
