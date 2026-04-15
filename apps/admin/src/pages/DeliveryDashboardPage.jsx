import React, { useEffect, useState } from "react";
import { apiGet, apiPatch } from "../services/api.js";
import { useNotifications } from "../contexts/NotificationContext.jsx";

function formatCurrency(value) {
  return `INR ${Number(value || 0).toFixed(2)}`;
}

const TABS = ["today", "delivered"];

export default function DeliveryDashboardPage() {
  const [activeTab, setActiveTab] = useState("today");
  const [todayDeliveries, setTodayDeliveries] = useState([]);
  const [delivered, setDelivered] = useState([]);
  const [status, setStatus] = useState("");
  const { notify } = useNotifications();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [todayData, deliveredData] = await Promise.all([
        apiGet("/deliveries/mine/today"),
        apiGet("/deliveries/mine/delivered")
      ]);
      setTodayDeliveries(Array.isArray(todayData) ? todayData : []);
      setDelivered(Array.isArray(deliveredData) ? deliveredData : []);
    } catch {
      setTodayDeliveries([]);
      setDelivered([]);
    }
  }

  async function markDelivered(deliveryId) {
    setStatus("");
    try {
      await apiPatch(`/deliveries/${deliveryId}`, { status: "DELIVERED" });
      setStatus("Delivery marked as delivered.");
      notify({ type: "success", message: "Delivery marked as delivered." });
      loadData();
    } catch (error) {
      const message = error.message || "Unable to update delivery.";
      setStatus(message);
      notify({ type: "error", message });
    }
  }

  const list = activeTab === "today" ? todayDeliveries : delivered;

  return (
    <section className="page-stack">
      <header className="topbar">
        <div>
          <h1>Delivery Dashboard</h1>
          <p>Today’s route, payment collection, and completed drops.</p>
        </div>
      </header>

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "tab-button active" : "tab-button"}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "today" ? "Today's Deliveries" : "Delivered Orders"}
          </button>
        ))}
      </div>

      <section className="sheet">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Amount</th>
              <th>Status</th>
              {activeTab === "today" ? <th>Action</th> : null}
            </tr>
          </thead>
          <tbody>
            {list.map((delivery) => (
              <tr key={delivery.id}>
                <td data-label="Customer">{delivery.customer?.name || "Customer"}</td>
                <td data-label="Phone">{delivery.customer?.phone || "-"}</td>
                <td data-label="Address">
                  {delivery.address
                    ? `${delivery.address.line1 || ""}, ${delivery.address.city || ""}`
                    : "Address"}
                </td>
                <td data-label="Product">{delivery.product?.name || "Product"}</td>
                <td data-label="Qty">
                  {delivery.quantity} {delivery.product?.unit || ""}
                </td>
                <td data-label="Amount">{formatCurrency(delivery.amountToCollect)}</td>
                <td data-label="Status">{delivery.status}</td>
                {activeTab === "today" ? (
                  <td data-label="Action">
                    <button type="button" onClick={() => markDelivered(delivery.id)}>
                      Mark Delivered
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && (
          <p className="empty">
            {activeTab === "today" ? "No deliveries assigned for today." : "No delivered orders yet."}
          </p>
        )}
        {status ? <p className="empty">{status}</p> : null}
      </section>
    </section>
  );
}
