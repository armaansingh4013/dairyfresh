import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useCart } from "../contexts/CartContext.jsx";
import AccountMenu from "../components/AccountMenu.jsx";

export default function AppLayout({ user, onLogout, children }) {
  const { itemCount } = useCart();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="page-shell">
      <div className="page">
        <header className="app-header">
          <div className="app-header-copy">
            <p className="eyebrow">Welcome</p>
            <h2>{user?.name || user?.phone || "Customer"}</h2>
          </div>
          <div className="app-header-actions">
            <NavLink className="ghost cart-link" to="/app/cart">
              Cart
              {itemCount ? <span className="cart-count">{itemCount}</span> : null}
            </NavLink>
            <AccountMenu onLogout={onLogout} />
            <button
              className="ghost nav-menu-toggle"
              type="button"
              aria-expanded={menuOpen}
              aria-label="Toggle navigation menu"
              onClick={() => setMenuOpen((current) => !current)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
          <div className="cta-row app-nav-desktop">
            <NavLink className="ghost" to="/app/dashboard">
              Dashboard
            </NavLink>
            <NavLink className="ghost" to="/app/start">
              Start
            </NavLink>
            <NavLink className="ghost" to="/app/subscriptions">
              Subscriptions
            </NavLink>
            <NavLink className="ghost" to="/app/orders">
              Orders
            </NavLink>
          </div>
          {menuOpen ? (
            <div className="mobile-nav-panel">
              <Link className="ghost wide" to="/app/dashboard">
                Dashboard
              </Link>
              <Link className="ghost wide" to="/app/start">
                Start
              </Link>
              <Link className="ghost wide" to="/app/subscriptions">
                Subscriptions
              </Link>
              <Link className="ghost wide" to="/app/orders">
                Orders
              </Link>
              <Link className="ghost wide" to="/app/profile">
                Profile
              </Link>
              <button className="ghost wide" type="button" onClick={onLogout}>
                Logout
              </button>
            </div>
          ) : null}
        </header>
        {children}
      </div>
    </div>
  );
}
