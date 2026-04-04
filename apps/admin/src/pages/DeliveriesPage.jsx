import React, { useEffect, useState } from "react";
import { apiGet, apiPatch, apiPost } from "../services/api.js";

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadDeliveries();
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

  async function markDelivered(deliveryId) {
    setStatus("");
    try {
      await apiPatch(`/deliveries/${deliveryId}`, { status: "DELIVERED" });
      setStatus("Delivery marked as delivered.");
      loadDeliveries();
    } catch {
      setStatus("Unable to update delivery status.");
    }
  }

  async function generateRouteSheet() {
    setStatus("");
    try {
      const res = await apiPost("/admin/deliveries/generate", {});
      setStatus(`Route sheet generated. ${res.created || 0} deliveries prepared.`);
      loadDeliveries();
    } catch {
      setStatus("Unable to generate route sheet.");
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Deliveries</h1>
          <p>Track daily delivery status and export route sheets.</p>
        </div>
        <button onClick={generateRouteSheet}>Generate Route Sheet</button>
      </header>

      <section className="sheet">
        <h2>Delivery Sheet</h2>
        <p className="status-text">Showing only today's delivery report.</p>
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((d) => (
              <tr key={d.id}>
                <td>{d.user?.name || "Customer"}</td>
                <td>{d.user?.phone || "-"}</td>
                <td>
                  {d.address ? `${d.address.line1}, ${d.address.city}` : "Address"}
                </td>
                <td>{d.product?.name || "Product"}</td>
                <td>
                  {d.quantity} {d.product?.unit || "L"}
                </td>
                <td>{d.status || "Pending"}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => markDelivered(d.id)}
                    disabled={d.status === "DELIVERED"}
                  >
                    {d.status === "DELIVERED" ? "Delivered" : "Mark Delivered"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!deliveries.length && <p className="empty">No deliveries for today.</p>}
        {status && <p className="empty">{status}</p>}
      </section>
    </>
  );
}
