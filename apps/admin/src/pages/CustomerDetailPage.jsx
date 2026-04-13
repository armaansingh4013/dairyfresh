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

const TABS = ["summary", "plans", "orders"];

export default function CustomerDetailPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("summary");
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, [customerId]);

  async function loadDetail() {
    setLoading(true);
    try {
      const data = await apiGet(`/admin/customers/${customerId}`);
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }

  const customer = detail?.customer;
  const plans = detail?.plans || [];
  const orders = detail?.orders || [];

  return (
    <section className="page-stack">
      <button className="ghost-button" type="button" onClick={() => navigate("/customers")}>
        Back to Customers
      </button>

      {loading && <div className="sheet"><p className="empty">Loading customer...</p></div>}

      {!loading && !detail && (
        <div className="sheet">
          <p className="empty">Unable to load customer details.</p>
        </div>
      )}

      {!loading && detail && (
        <>
          <header className="topbar">
            <div>
              <h1>{customer?.name || "Customer"}</h1>
              <p>
                {customer?.phone || "-"}
                {customer?.email ? ` • ${customer.email}` : ""}
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
                {tab === "summary" ? "Summary" : tab === "plans" ? "Plans" : "Orders"}
              </button>
            ))}
          </div>

          {activeTab === "summary" && (
            <>
              <section className="stats">
                <Stat label="Joined" value={formatDate(customer?.joinedAt)} />
                <Stat label="Active Plans" value={String(plans.filter((plan) => plan.status === "ACTIVE").length)} />
                <Stat label="Total Plans" value={String(plans.length)} />
                <Stat label="Total Orders" value={String(orders.length)} />
              </section>

              <section className="sheet">
                <h2>Addresses</h2>
                {(customer?.addresses || []).length ? (
                  <div className="detail-grid">
                    {customer.addresses.map((address) => (
                      <div key={address.id || `${address.line1}-${address.city}`} className="mini-card">
                        <strong>{address.title || "Address"}</strong>
                        <p>{address.houseNumber || "-"}</p>
                        <p>{address.line1 || "-"}</p>
                        <p>{address.city || "-"}</p>
                        <p>{address.postalCode || "-"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty">No address saved.</p>
                )}
              </section>
            </>
          )}

          {activeTab === "plans" && (
            <section className="sheet">
              <h2>Plans</h2>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Mode</th>
                    <th>Quantity</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr
                      key={plan.id}
                      className="data-row"
                      onClick={() => navigate(`/subscriptions/${plan.id}`)}
                    >
                      <td>{plan.product?.name || "Product"}</td>
                      <td>{plan.mode}</td>
                      <td>
                        {plan.defaultQuantity} {plan.product?.unit || ""}
                      </td>
                      <td>{formatDate(plan.startDate)}</td>
                      <td>{formatDate(plan.endDate)}</td>
                      <td>{plan.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!plans.length && <p className="empty">No plans for this customer.</p>}
            </section>
          )}

          {activeTab === "orders" && (
            <section className="sheet">
              <h2>Orders</h2>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{formatDate(order.date)}</td>
                      <td>{order.type}</td>
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
              {!orders.length && <p className="empty">No orders for this customer.</p>}
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
