import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useCart } from "../contexts/CartContext.jsx";
import AccountMenu from "../components/AccountMenu.jsx";

export default function MarketingLayout({ user, onLogout, children }) {
  const { itemCount } = useCart();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="page-shell">
      <div className="page">
        <header className="top-nav">
          <div className="brand">
            <span className="brand-dot" />
            <div>
              <strong>Mazara Dairy</strong>
              <p>Fresh dairy subscriptions</p>
            </div>
          </div>
          <nav className="nav-links nav-links-desktop">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </nav>
          <div className="nav-actions">
            <Link className="ghost cart-link" to="/cart">
              Cart
              {itemCount ? <span className="cart-count">{itemCount}</span> : null}
            </Link>
            {user ? (
              <>
                <Link className="ghost nav-dashboard-link" to="/app/dashboard">
                  Dashboard
                </Link>
                <AccountMenu onLogout={onLogout} />
              </>
            ) : (
              <>
                <Link className="ghost nav-auth-link" to="/login">
                  Login
                </Link>
                <Link className="primary nav-auth-link" to="/signup">
                  Sign Up
                </Link>
              </>
            )}
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
          {menuOpen ? (
            <div className="mobile-nav-panel">
              <Link className="ghost wide" to="/">
                Home
              </Link>
              <Link className="ghost wide" to="/products">
                Products
              </Link>
              <Link className="ghost wide" to="/about">
                About
              </Link>
              <Link className="ghost wide" to="/contact">
                Contact
              </Link>
              {user ? (
                <>
                  <Link className="ghost wide" to="/app/dashboard">
                    Dashboard
                  </Link>
                  <Link className="ghost wide" to="/app/profile">
                    Profile
                  </Link>
                  <button className="ghost wide" type="button" onClick={onLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link className="ghost wide" to="/login">
                    Login
                  </Link>
                  <Link className="primary wide" to="/signup">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          ) : null}
        </header>
        {children}
      </div>
    </div>
  );
}
