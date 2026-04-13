import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../services/api.js";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      const data = await apiGet("/admin/customers");
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      setCustomers([]);
    }
  }

  return (
    <section className="sheet">
      <h2>Customers</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Active Plans</th>
            <th>Total Orders</th>
            <th>Last Order</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="data-row"
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              <td>{customer.name || "Customer"}</td>
              <td>{customer.phone || "-"}</td>
              <td>{customer.email || "-"}</td>
              <td>{customer.activePlans || 0}</td>
              <td>{customer.totalOrders || 0}</td>
              <td>{formatDate(customer.lastOrderDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!customers.length && <p className="empty">No customers found.</p>}
    </section>
  );
}
