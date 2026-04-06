import React from "react";
import { NavLink } from "react-router-dom";
import { useCart } from "../contexts/CartContext.jsx";

export default function AppLayout({ user, onLogout, children }) {
  const { itemCount } = useCart();

  return (
    <div className="page-shell">
      <div className="page">
        <header className="app-header">
          <div>
            <p className="eyebrow">Welcome</p>
            <h2>{user?.name || user?.phone || "Customer"}</h2>
          </div>
          <div className="cta-row">
            <NavLink className="ghost" to="/app/dashboard">
              Dashboard
            </NavLink>
            <NavLink className="ghost" to="/app/start">
              Start
            </NavLink>
            <NavLink className="ghost" to="/app/ongoing">
              Ongoing
            </NavLink>
            <NavLink className="ghost" to="/app/subscriptions">
              Subscriptions
            </NavLink>
            <NavLink className="ghost" to="/app/billing">
              Billing
            </NavLink>
            <NavLink className="ghost" to="/app/profile">
              Profile
            </NavLink>
            <NavLink className="ghost" to="/app/orders">
              Orders
            </NavLink>
            <NavLink className="ghost cart-link" to="/cart">
              Cart
              {itemCount ? <span className="cart-count">{itemCount}</span> : null}
            </NavLink>
            <button className="ghost" onClick={onLogout}>
              Logout
            </button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
