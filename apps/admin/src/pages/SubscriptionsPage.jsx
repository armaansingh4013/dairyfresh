import React, { useEffect, useState } from "react";
import { apiGet } from "../services/api.js";

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const data = await apiGet("/admin/subscriptions");
      const list = Array.isArray(data) ? data : [];
      setPlans(list.filter((plan) => plan.status !== "CANCELLED"));
    } catch {
      setPlans([]);
    }
  }

  return (
    <section className="sheet">
      <h2>All Subscriptions</h2>
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Phone</th>
            <th>Product</th>
            <th>Mode</th>
            <th>Quantity</th>
            <th>Status</th>
            <th>Delivered Days</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => {
            const deliveredCount = (plan.deliveries || []).filter(
              (delivery) => delivery.status === "DELIVERED"
            ).length;

            return (
              <tr key={plan.id}>
                <td>{plan.user?.name || "Customer"}</td>
                <td>{plan.user?.phone || "-"}</td>
                <td>{plan.product?.name || "Product"}</td>
                <td>{plan.mode}</td>
                <td>{plan.defaultQuantity}</td>
                <td>{plan.status}</td>
                <td>{deliveredCount}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!plans.length && <p className="empty">No subscriptions found.</p>}
    </section>
  );
}
