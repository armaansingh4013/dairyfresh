import React from "react";
import { NavLink } from "react-router-dom";

const ADMIN_NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "deliveries", label: "Deliveries" },
  { id: "products", label: "Products" },
  { id: "customers", label: "Customers" },
  { id: "billing", label: "Billing" },
  { id: "reports", label: "Reports" }
];

const DELIVERY_NAV_ITEMS = [{ id: "delivery", label: "My Deliveries" }];

export default function AdminLayout({ children, user, onLogout }) {
  const navItems = user?.role === "DELIVERY" ? DELIVERY_NAV_ITEMS : ADMIN_NAV_ITEMS;

  return (
    <div className="admin">
      <aside className="sidebar">
        <div className="sidebar-head">
          <div>
            <h2>Mazara Dairy</h2>
            <p className="sidebar-subtitle">
              {user?.role === "DELIVERY" ? "Delivery Panel" : "Admin Panel"}
            </p>
          </div>
          <button type="button" className="ghost-button" onClick={onLogout}>
            Logout
          </button>
        </div>

        <div className="sidebar-user">
          <strong>{user?.name || "User"}</strong>
          <p>{user?.email || user?.phone || "-"}</p>
          <span className="role-pill">{user?.role || "-"}</span>
        </div>

        <nav>
          {navItems.map((item) => (
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
