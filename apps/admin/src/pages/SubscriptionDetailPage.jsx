import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet } from "../services/api.js";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function formatCurrency(value) {
  return `INR ${Number(value || 0).toFixed(2)}`;
}

const TABS = ["summary", "customer", "orders"];

export default function SubscriptionDetailPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("summary");
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, [planId]);

  async function loadDetail() {
    setLoading(true);
    try {
      const data = await apiGet(`/admin/subscriptions/${planId}`);
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }

  const plan = detail?.plan;
  const customer = detail?.customer;
  const orders = detail?.orders || [];

  return (
    <section className="page-stack">
      <button className="ghost-button" type="button" onClick={() => navigate("/subscriptions")}>
        Back to Subscriptions
      </button>

      {loading && <div className="sheet"><p className="empty">Loading subscription...</p></div>}

      {!loading && !detail && (
        <div className="sheet">
          <p className="empty">Unable to load subscription details.</p>
        </div>
      )}

      {!loading && detail && (
        <>
          <header className="topbar">
            <div>
              <h1>{plan?.product?.name || "Subscription"}</h1>
              <p>
                {customer?.name || "Customer"}
                {customer?.phone ? ` • ${customer.phone}` : ""}
              </p>
            </div>
          </header>

          <div className="tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={activeTab === tab ? "tab-button active" : "tab-button"}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "summary" ? "Summary" : tab === "customer" ? "Customer" : "Orders"}
              </button>
            ))}
          </div>

          {activeTab === "summary" && (
            <>
              <section className="stats">
                <Stat label="Start Date" value={formatDate(plan?.startDate)} />
                <Stat label="End Date" value={formatDate(plan?.endDate)} />
                <Stat
                  label="Quantity"
                  value={`${plan?.defaultQuantity || 0} ${plan?.product?.unit || ""}`}
                />
                <Stat label="Status" value={plan?.status || "-"} />
              </section>

              <section className="sheet">
                <h2>Subscription Summary</h2>
                <div className="detail-grid">
                  <div className="mini-card">
                    <strong>Product</strong>
                    <p>{plan?.product?.name || "Product"}</p>
                    <p>{formatCurrency(plan?.product?.price)}</p>
                  </div>
                  <div className="mini-card">
                    <strong>Plan Mode</strong>
                    <p>{plan?.mode || "-"}</p>
                    <p>
                      {plan?.defaultQuantity || 0} {plan?.product?.unit || ""}
                    </p>
                  </div>
                  <div className="mini-card">
                    <strong>Delivery Progress</strong>
                    <p>{plan?.completedDeliveries || 0} completed</p>
                    <p>{plan?.totalDeliveries || 0} total</p>
                  </div>
                  <div className="mini-card">
                    <strong>Address</strong>
                    <p>{plan?.address?.line1 || "-"}</p>
                    <p>{plan?.address?.city || "-"}</p>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === "customer" && (
            <section className="sheet">
              <h2>Customer</h2>
              <div className="detail-grid">
                <div className="mini-card">
                  <strong>Name</strong>
                  <p>{customer?.name || "Customer"}</p>
                </div>
                <div className="mini-card">
                  <strong>Phone</strong>
                  <p>{customer?.phone || "-"}</p>
                </div>
                <div className="mini-card">
                  <strong>Email</strong>
                  <p>{customer?.email || "-"}</p>
                </div>
                <div className="mini-card">
                  <strong>Joined</strong>
                  <p>{formatDate(customer?.joinedAt)}</p>
                </div>
              </div>

              <div className="sheet-actions">
                <button
                  type="button"
                  onClick={() => navigate(`/customers/${customer?.id}`)}
                  disabled={!customer?.id}
                >
                  Open Customer Page
                </button>
              </div>
            </section>
          )}

          {activeTab === "orders" && (
            <section className="sheet">
              <h2>Plan Orders</h2>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{formatDate(order.date)}</td>
                      <td>
                        {(order.items || [])
                          .map((item) => `${item.name} (${item.quantity} ${item.unit || ""})`)
                          .join(", ") || "-"}
                      </td>
                      <td>{formatCurrency(order.totalAmount)}</td>
                      <td>{order.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!orders.length && <p className="empty">No orders linked to this subscription.</p>}
            </section>
          )}
        </>
      )}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <p>{label}</p>
      <h3>{value}</h3>
    </div>
  );
}
