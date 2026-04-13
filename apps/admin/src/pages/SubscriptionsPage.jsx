import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../services/api.js";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState([]);
  const navigate = useNavigate();

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
            <th>Start Date</th>
            <th>End Date</th>
            <th>Quantity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr
              key={plan.id}
              className="data-row"
              onClick={() => navigate(`/subscriptions/${plan.id}`)}
            >
              <td>{plan.user?.name || "Customer"}</td>
              <td>{plan.user?.phone || "-"}</td>
              <td>{plan.product?.name || "Product"}</td>
              <td>{formatDate(plan.startDate)}</td>
              <td>{formatDate(plan.endDate)}</td>
              <td>
                {plan.defaultQuantity} {plan.product?.unit || ""}
              </td>
              <td>{plan.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!plans.length && <p className="empty">No subscriptions found.</p>}
    </section>
  );
}
