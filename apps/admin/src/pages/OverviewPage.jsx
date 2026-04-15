import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../services/api.js";
import { useNotifications } from "../contexts/NotificationContext.jsx";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function OverviewPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [activePlans, setActivePlans] = useState([]);
  const [routeStatus, setRouteStatus] = useState("");
  const { notify } = useNotifications();

  useEffect(() => {
    loadDeliveries();
    loadActivePlans();
  }, []);

  async function loadDeliveries() {
    try {
      const data = await apiGet("/admin/deliveries/daily");
      const list = Array.isArray(data) ? data : [];
      setDeliveries(list.filter((delivery) => delivery.status !== "CANCELLED"));
    } catch {
      setDeliveries([]);
    }
  }

  async function loadActivePlans() {
    try {
      const data = await apiGet("/admin/subscriptions/summary");
      setActivePlans(Array.isArray(data) ? data : []);
    } catch {
      setActivePlans([]);
    }
  }

  async function generateRouteSheet() {
    setRouteStatus("");
    try {
      const res = await apiPost("/admin/deliveries/generate", {});
      setRouteStatus(`Route sheet generated. ${res.created || 0} deliveries prepared.`);
      notify({
        type: "success",
        message: `Route sheet generated. ${res.created || 0} deliveries prepared.`
      });
      loadDeliveries();
    } catch (error) {
      const message = error.message || "Unable to generate route sheet.";
      setRouteStatus(message);
      notify({ type: "error", message });
    }
  }

  const totalLiters = useMemo(
    () => deliveries.reduce((sum, item) => sum + (item.totalQuantity || 0), 0),
    [deliveries]
  );

  const totalCustomers = useMemo(
    () => new Set(deliveries.map((item) => item.customer?.id).filter(Boolean)).size,
    [deliveries]
  );

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Daily Overview</h1>
          <p>Everything your team needs for today's delivery run.</p>
        </div>
        <button onClick={generateRouteSheet}>Generate Route Sheet</button>
      </header>

      <section className="stats">
        <Stat label="Total Customers" value={String(totalCustomers)} />
        <Stat label="Today's Litres" value={`${totalLiters} L`} />
        <Stat label="Outstanding Payments" value="INR 0" />
        <Stat label="Deliveries Pending" value={String(deliveries.length)} />
      </section>

      <section className="sheet">
        <h2>Active Subscriptions</h2>
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Product</th>
              <th>Mode</th>
              <th>Quantity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {activePlans.map((plan) => (
              <tr key={plan.id}>
                <td>{plan.user?.name || plan.user?.phone || "Customer"}</td>
                <td>{plan.product?.name || "Product"}</td>
                <td>{plan.mode}</td>
                <td>{plan.defaultQuantity}</td>
                <td>{plan.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!activePlans.length && <p className="empty">No active subscriptions.</p>}
      </section>

      <section className="sheet">
        <h2>Delivery Sheet</h2>
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Address</th>
              <th>Items</th>
              <th>Qty</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((d) => (
              <tr key={d.id}>
                <td>{d.customer?.name || "Customer"}</td>
                <td>
                  {d.address ? `${d.address.line1}, ${d.address.city}` : "Address"}
                </td>
                <td>{d.itemCount || 0}</td>
                <td>{d.totalQuantity || 0}</td>
                <td>{d.status || "Pending"}</td>
                <td>{formatDate(d.plan?.startDate)}</td>
                <td>{formatDate(d.plan?.endDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!deliveries.length && <p className="empty">No deliveries for today.</p>}
        {routeStatus && <p className="empty">{routeStatus}</p>}
      </section>
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <p>{label}</p>
      <h3>{value}</h3>
    </div>
  );
}
