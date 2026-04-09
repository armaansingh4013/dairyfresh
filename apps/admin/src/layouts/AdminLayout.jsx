import React from "react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "deliveries", label: "Deliveries" },
  { id: "products", label: "Products" },
  { id: "customers", label: "Customers" },
  { id: "billing", label: "Billing" },
  { id: "reports", label: "Reports" }
];

export default function AdminLayout({ children }) {
  return (
    <div className="admin">
      <aside className="sidebar">
        <h2>Mazara Dairy Admin</h2>
        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={`/${item.id}`}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
