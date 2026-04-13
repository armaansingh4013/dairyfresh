import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../services/api.js";

function formatMoney(value) {
  return `INR ${Number(value || 0).toFixed(0)}`;
}

function formatAddress(address) {
  if (!address) return "";

  return [
    address.houseNumber,
    address.line1,
    address.line2,
    address.landmark,
    address.city,
    address.state,
    address.postalCode
  ]
    .filter(Boolean)
    .join(", ");
}

export default function OrdersPage({ user }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      setLoadingOrders(true);
      try {
        const data = await apiGet(`/orders/users/${encodeURIComponent(user.id)}`);
        const nextOrders = Array.isArray(data) ? data : [];
        setOrders(nextOrders);
        setSelectedOrder((current) =>
          current ? nextOrders.find((order) => order.id === current.id) || null : null
        );
      } catch {
        setOrders([]);
        setSelectedOrder(null);
      } finally {
        setLoadingOrders(false);
      }
    }

    loadOrders();
  }, [user.id]);

  return (
    <section className="section-card">
      <p className="section-kicker">Orders</p>
      <h2>Your Orders</h2>
      {loadingOrders ? (
        <p className="inline-loader">
          <span className="button-spinner" aria-hidden="true" />
          Loading orders...
        </p>
      ) : null}
      {orders.length ? (
        <div className="saved-orders">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              className="plan-card order-summary-card"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="summary-row">
                <div>
                  <strong>Order #{order.id.slice(-6).toUpperCase()}</strong>
                  <p>
                    Delivery date: {new Date(order.date).toLocaleDateString()}
                  </p>
                </div>
                <span className="badge">{order.status}</span>
              </div>
              <div className="order-summary-grid">
                <span>{order.items.length} item{order.items.length === 1 ? "" : "s"}</span>
                <span>{formatMoney(order.items.reduce((total, item) => {
  return total + (item.quantity * item.product.price);
}, 0))}</span>
                <span>{order.paymentStatus}</span>
                <span>View details</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="empty-state">{loadingOrders ? "Loading orders..." : "No orders yet."}</p>
      )}
      {selectedOrder ? (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="section-kicker">Order Details</p>
                <h3 id="order-detail-title">
                  Order #{selectedOrder.id.slice(-6).toUpperCase()}
                </h3>
              </div>
              <button className="ghost" type="button" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>

            <div className="history-metrics">
              <span>Status: {selectedOrder.status}</span>
              <span>Payment: {selectedOrder.paymentStatus}</span>
              <span>Delivery: {new Date(selectedOrder.date).toLocaleDateString()}</span>
              <span>Total: {formatMoney(selectedOrder.totalAmount)}</span>
            </div>

        

            <div className="cart-list">
              {selectedOrder.items.map((item) => {
                const unitPrice = Number(item.unitPrice || item.product?.price || 0);
                const quantity = Number(item.quantity || 0);

                return (
                  <div key={item.id || item.productId} className="cart-line">
                    <div>
                      <strong>{item.productName || item.product?.name || "Product"}</strong>
                      <p>
                        {quantity} x {formatMoney(unitPrice)}
                      </p>
                    </div>
                    <strong>{formatMoney(quantity * unitPrice)}</strong>
                  </div>
                );
              })}
            </div>

            {selectedOrder.address ? (
              <div className="detail-panel">
                <strong>Delivery address</strong>
                <p>{formatAddress(selectedOrder.address)}</p>
              </div>
            ) : null}

            {selectedOrder.note ? (
              <div className="detail-panel">
                <strong>Note</strong>
                <p>{selectedOrder.note}</p>
              </div>
            ) : null}

{selectedOrder.planId ? (
              <div className="cta-row" style={{ justifyContent: "center", marginTop: "2rem" }}>
                <Link className="primary" to={`/app/subscriptions/${selectedOrder.planId}`}>
                  Go to Subscription
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
