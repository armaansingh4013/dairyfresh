import React, { useEffect, useMemo, useState } from "react";
import { apiGet } from "../services/api.js";

export default function CustomersPage() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    try {
      const data = await apiGet("/admin/subscriptions/summary");
      setPlans(Array.isArray(data) ? data : []);
    } catch {
      setPlans([]);
    }
  }

  const activePlans = useMemo(
    () => plans.filter((plan) => plan.status === "ACTIVE"),
    [plans]
  );

  return (
    <section className="sheet">
      <h2>Active Subscriptions</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Plan</th>
            <th>Mode</th>
            <th>Quantity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {activePlans.map((plan) => (
            <tr key={plan.id}>
              <td>{plan.user?.name || "Customer"}</td>
              <td>{plan.user?.phone || "-"}</td>
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
  );
}
