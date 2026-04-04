import React from "react";
import { Link, NavLink } from "react-router-dom";

export default function MarketingLayout({ user, onLogout, children }) {
  return (
    <div className="page-shell">
      <div className="page">
        <header className="top-nav">
          <div className="brand">
            <span className="brand-dot" />
            <div>
              <strong>DairyDaily</strong>
              <p>Fresh dairy subscriptions</p>
            </div>
          </div>
          <nav className="nav-links">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </nav>
          <div className="nav-actions">
            {user ? (
              <>
                <Link className="ghost" to="/app/dashboard">
                  Dashboard
                </Link>
                <button className="ghost" onClick={onLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="ghost" to="/login">
                  Login
                </Link>
                <Link className="primary" to="/signup">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
