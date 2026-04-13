import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../services/api.js";

function formatCurrency(value) {
  return `INR ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [status, setStatus] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadDeliveries();
  }, []);

  async function loadDeliveries() {
    try {
      const data = await apiGet("/admin/deliveries/daily");
      setDeliveries(Array.isArray(data) ? data : []);
    } catch {
      setDeliveries([]);
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

  function toggleRow(id) {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Deliveries</h1>
          <p>Open a row to inspect the order items for today's route.</p>
        </div>
        <button onClick={generateRouteSheet}>Generate Route Sheet</button>
      </header>

      <section className="sheet">
        <h2>Delivery Sheet</h2>
        <p className="status-text">Showing today's order-wise delivery list.</p>
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Items</th>
              <th>Total Qty</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Plan Dates</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((delivery) => (
              <React.Fragment key={delivery.id}>
                <tr
                  className={expandedId === delivery.id ? "data-row expanded" : "data-row"}
                  onClick={() => toggleRow(delivery.id)}
                >
                  <td>{delivery.customer?.name || "Customer"}</td>
                  <td>{delivery.customer?.phone || "-"}</td>
                  <td>
                    {delivery.address
                      ? `${delivery.address.line1 || ""}${delivery.address.city ? `, ${delivery.address.city}` : ""}`
                      : "Address"}
                  </td>
                  <td>{delivery.itemCount || 0}</td>
                  <td>{delivery.totalQuantity || 0}</td>
                  <td>{formatCurrency(delivery.totalAmount)}</td>
                  <td>{delivery.type}</td>
                  <td>
                    {delivery.plan
                      ? `${formatDate(delivery.plan.startDate)} to ${formatDate(
                          delivery.plan.endDate
                        )}`
                      : "-"}
                  </td>
                  <td>{delivery.status || "Pending"}</td>
                </tr>
                {expandedId === delivery.id && (
                  <tr className="detail-row">
                    <td colSpan="9">
                      <div className="detail-card">
                        <h3>Items</h3>
                        <table className="subtable">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Quantity</th>
                              <th>Unit</th>
                              <th>Price</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(delivery.items || []).map((item, index) => (
                              <tr key={`${delivery.id}-${item.productId || index}`}>
                                <td>{item.name}</td>
                                <td>{item.quantity}</td>
                                <td>{item.unit || "-"}</td>
                                <td>{formatCurrency(item.unitPrice)}</td>
                                <td>{formatCurrency(item.lineTotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {!deliveries.length && <p className="empty">No deliveries for today.</p>}
        {status && <p className="empty">{status}</p>}
      </section>
    </>
  );
}
