import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const ADMIN_NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "deliveries", label: "Deliveries" },
  { id: "products", label: "Products" },
  { id: "users", label: "Users" },
  { id: "customers", label: "Customers" },
  { id: "billing", label: "Billing" },
  { id: "reports", label: "Reports" }
];

const DELIVERY_NAV_ITEMS = [{ id: "delivery", label: "My Deliveries" }];

export default function AdminLayout({ children, user, onLogout }) {
  const navItems = user?.role === "DELIVERY" ? DELIVERY_NAV_ITEMS : ADMIN_NAV_ITEMS;
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="admin">
      <aside className={menuOpen ? "sidebar mobile-open" : "sidebar"}>
        <div className="sidebar-head">
          <div className="sidebar-brand-row">
            <div>
              <h2>Mazara Dairy</h2>
              <p className="sidebar-subtitle">
                {user?.role === "DELIVERY" ? "Delivery Panel" : "Admin Panel"}
              </p>
            </div>
            <button
              type="button"
              className="hamburger-button"
              onClick={() => setMenuOpen((current) => !current)}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
          <button type="button" className="ghost-button" onClick={onLogout}>
            Logout
          </button>
        </div>

        <div className={menuOpen ? "sidebar-body open" : "sidebar-body"}>
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
                onClick={closeMenu}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
