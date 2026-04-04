import React from "react";
import { NavLink } from "react-router-dom";

export default function AppLayout({ user, onLogout, children }) {
  return (
    <div className="page-shell">
      <div className="page">
        <header className="app-header">
          <div>
            <p className="eyebrow">Welcome</p>
            <h2>{user?.phone || "Customer"}</h2>
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
