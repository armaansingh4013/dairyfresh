import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../services/api.js";
import { useCart } from "../contexts/CartContext.jsx";

function formatAddress(address) {
  return [address.houseNumber, address.line1, address.line2, address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(", ");
}

export default function CartPage({ user }) {
  const navigate = useNavigate();
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadAddresses() {
      if (!user?.id) {
        setAddresses([]);
        setAddressId("");
        return;
      }

      try {
        const data = await apiGet(`/users/${user.id}/addresses`);
        const nextAddresses = Array.isArray(data) ? data : [];
        setAddresses(nextAddresses);
        const defaultAddress =
          nextAddresses.find((address) => address.isDefault) || nextAddresses[0] || null;
        setAddressId(defaultAddress?.id || "");
      } catch {
        setAddresses([]);
        setAddressId("");
      }
    }

    loadAddresses();
  }, [user?.id]);

  async function handleCheckout() {
    setStatus("");

    if (!items.length) {
      setStatus("Your cart is empty.");
      return;
    }

    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent("/cart")}`);
      return;
    }

    if (!addressId) {
      setStatus("Select an address before placing the order.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPost("/orders", {
        userId: user.id,
        addressId,
        date,
        note,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity || 0)
        }))
      });
      clearCart();
      navigate("/app/orders");
    } catch (error) {
      setStatus(error.message || "Unable to place order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="checkout-layout">
      <section className="section-card">
        <p className="section-kicker">Cart</p>
        <h2>Your Cart</h2>
        {items.length ? (
          <div className="cart-list">
            {items.map((item) => (
              <article key={item.productId} className="cart-item">
                <div>
                  <strong>{item.name}</strong>
                  <p>
                    INR {item.price} / {item.unit}
                  </p>
                </div>
                <div className="qty-stepper">
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  >
                    -
                  </button>
                  <strong>{item.quantity}</strong>
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    className=" danger"
                    type="button"
                    onClick={() => removeItem(item.productId)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">Your cart is empty. Add products to place an order.</p>
        )}
      </section>

      <aside className="section-card">
        <p className="section-kicker">Checkout</p>
        <h2>Pay and Order</h2>
        <div className="summary-list">
          <div className="summary-row">
            <span>Items</span>
            <strong>{itemCount}</strong>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <strong>INR {subtotal.toFixed(0)}</strong>
          </div>
        </div>

        {user ? (
          <>
            <label className="field">
              <span>Delivery Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="field">
              <span>Address</span>
              <select value={addressId} onChange={(e) => setAddressId(e.target.value)}>
                <option value="">Select address</option>
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.title}: {formatAddress(address)}
                  </option>
                ))}
              </select>
            </label>
            {!addresses.length ? (
              <p className="message">
                No saved address found. Add one from{" "}
                <Link to="/app/profile">your profile</Link> before ordering.
              </p>
            ) : null}
            <label className="field">
              <span>Note</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Deliver before 7 AM"
              />
            </label>
          </>
        ) : (
          <p className="message">
            You can build the cart as a guest. Login is required only when you place the order.
          </p>
        )}

        <div className="cta-row">
          <Link className="ghost" to="/products">
            Keep Shopping
          </Link>
          <button className="primary" type="button" onClick={handleCheckout} disabled={isSubmitting}>
            {user ? "Pay and Order" : "Login to Order"}
          </button>
        </div>
        {status ? <p className="message">{status}</p> : null}
      </aside>
    </div>
  );
}
