import React, { useEffect, useState } from "react";
import { apiGet } from "../../services/api.js";

export default function OrdersPage({ user }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await apiGet(`/orders/users/${encodeURIComponent(user.id)}`);
        setOrders(Array.isArray(data) ? data : []);
      } catch {
        setOrders([]);
      }
    }

    loadOrders();
  }, [user.id]);

  return (
    <section className="section-card">
      <p className="section-kicker">Orders</p>
      <h2>Your Orders</h2>
      {orders.length ? (
        <div className="saved-orders">
          {orders.map((order) => (
            <article key={order.id} className="plan-card">
              <div className="summary-row">
                <div>
                  <strong>Order #{order.id.slice(-6).toUpperCase()}</strong>
                  <p>
                    Delivery date: {new Date(order.date).toLocaleDateString()}
                  </p>
                </div>
                <span className="badge">{order.status}</span>
              </div>
              <div className="cart-list">
                {order.items.map((item) => (
                  <div key={item.id || item.productId} className="cart-line">
                    <div>
                      <strong>{item.productName || item.product?.name || "Product"}</strong>
                      <p>
                        {item.quantity} x INR {item.unitPrice || item.product?.price || 0}
                      </p>
                    </div>
                    <strong>
                      INR {Number(item.quantity || 0) * Number(item.unitPrice || item.product?.price || 0)}
                    </strong>
                  </div>
                ))}
              </div>
              <div className="history-metrics">
                <span>Total: INR {Number(order.totalAmount || 0).toFixed(0)}</span>
                <span>Payment: {order.paymentStatus}</span>
                {order.address ? (
                  <span>
                    {[
                      order.address.houseNumber,
                      order.address.line1,
                      order.address.city
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                ) : null}
              </div>
              {order.note ? <p className="empty-state">Note: {order.note}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">No orders yet.</p>
      )}
    </section>
  );
}
