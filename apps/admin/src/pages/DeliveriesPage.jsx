import React, { useEffect, useState } from "react";
import { apiGet, apiPatch } from "../services/api.js";
import { useNotifications } from "../contexts/NotificationContext.jsx";

const ORDER_TABS = [
  { id: "today", label: "Today's Orders" },
  { id: "upcoming", label: "Upcoming Orders" },
  { id: "completed", label: "Completed Orders" }
];

function formatCurrency(value) {
  return `INR ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatDateHeading(value) {
  if (!value) return "Unknown Date";
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function formatAddress(address) {
  if (!address) return "Address";
  return `${address.line1 || ""}${address.city ? `, ${address.city}` : ""}`;
}

function groupOrdersByDate(orders) {
  const grouped = new Map();

  for (const order of orders) {
    const dateKey = String(order.date || "").split("T")[0] || "unknown";
    const current = grouped.get(dateKey) || [];
    current.push(order);
    grouped.set(dateKey, current);
  }

  return Array.from(grouped.entries()).map(([dateKey, items]) => ({
    dateKey,
    label: formatDateHeading(items[0]?.date),
    items
  }));
}

function ActionMenu({ order, isOpen, onToggle, onMarkDelivered, onCancelOrder }) {
  return (
    <div className="row-action-menu">
      <button
        type="button"
        className="icon-button"
        aria-label={`Open actions for order ${order.id}`}
        aria-expanded={isOpen}
        onClick={(event) => {
          event.stopPropagation();
          onToggle(order.id);
        }}
      >
        &#8942;
      </button>
      {isOpen ? (
        <div
          className="row-action-popover"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          {order.status !== "COMPLETED" ? (
            <button
              type="button"
              className="menu-button"
              onClick={() => onMarkDelivered(order.id)}
            >
              Mark Delivered
            </button>
          ) : null}
          {order.status !== "CANCELLED" && order.status !== "COMPLETED" ? (
            <button
              type="button"
              className="menu-button menu-button-danger"
              onClick={() => onCancelOrder(order.id)}
            >
              Cancel Order
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function OrderRows({
  orders,
  expandedId,
  actionMenuId,
  onToggle,
  onToggleActionMenu,
  showActions = false,
  onMarkDelivered,
  onCancelOrder
}) {
  return (
    <>
      {orders.map((order) => (
        <React.Fragment key={order.id}>
          <tr
            className={expandedId === order.id ? "data-row expanded" : "data-row"}
            onClick={() => onToggle(order.id)}
          >
            <td data-label="Date">{formatDate(order.date)}</td>
            <td data-label="Customer">{order.customer?.name || "Customer"}</td>
            <td data-label="Phone">{order.customer?.phone || "-"}</td>
            <td data-label="Address">{formatAddress(order.address)}</td>
            <td data-label="Items">{order.itemCount || 0}</td>
            <td data-label="Total Qty">{order.totalQuantity || 0}</td>
            <td data-label="Amount">{formatCurrency(order.totalAmount)}</td>
            <td data-label="Status">{order.status}</td>
            {showActions ? (
              <td data-label="Action">
                <ActionMenu
                  order={order}
                  isOpen={actionMenuId === order.id}
                  onToggle={onToggleActionMenu}
                  onMarkDelivered={onMarkDelivered}
                  onCancelOrder={onCancelOrder}
                />
              </td>
            ) : null}
          </tr>
          {expandedId === order.id && (
            <tr className="detail-row">
              <td colSpan={showActions ? "9" : "8"}>
                <div className="detail-card">
                  <div className="detail-grid">
                    <div className="mini-card">
                      <strong>Customer</strong>
                      <p>{order.customer?.name || "Customer"}</p>
                      <p>{order.customer?.phone || "-"}</p>
                      <p>{order.customer?.email || "-"}</p>
                    </div>
                    <div className="mini-card">
                      <strong>Order</strong>
                      <p>Type: {order.type || "-"}</p>
                      <p>Status: {order.status || "-"}</p>
                      <p>Date: {formatDate(order.date)}</p>
                    </div>
                    <div className="mini-card">
                      <strong>Plan</strong>
                      <p>
                        {order.plan
                          ? `${formatDate(order.plan.startDate)} to ${formatDate(
                              order.plan.endDate
                            )}`
                          : "One-time order"}
                      </p>
                      <p>{order.plan?.status || "-"}</p>
                    </div>
                    <div className="mini-card">
                      <strong>Address</strong>
                      <p>{order.address?.line1 || "-"}</p>
                      <p>{order.address?.city || "-"}</p>
                      <p>{order.address?.postalCode || "-"}</p>
                    </div>
                  </div>
                  <h3>Items</h3>
                  <table className="subtable">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(order.items || []).map((item, index) => (
                        <tr key={`${order.id}-${item.productId || index}`}>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>{item.unit || "-"}</td>
                          <td>{formatCurrency(item.unitPrice)}</td>
                          <td>{formatCurrency(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          )}
        </React.Fragment>
      ))}
    </>
  );
}

export default function DeliveriesPage() {
  const [activeTab, setActiveTab] = useState("today");
  const [todayOrders, setTodayOrders] = useState([]);
  const [upcomingOrders, setUpcomingOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);
  const [status, setStatus] = useState("");
  const [openTodaySection, setOpenTodaySection] = useState(true);
  const [openUpcomingDates, setOpenUpcomingDates] = useState({});
  const [openCompletedDates, setOpenCompletedDates] = useState({});
  const { notify } = useNotifications();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!event.target.closest(".row-action-menu")) {
        setActionMenuId(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  async function loadOrders() {
    try {
      const [today, upcoming, completed] = await Promise.all([
        apiGet("/admin/orders?scope=today"),
        apiGet("/admin/orders?scope=upcoming"),
        apiGet("/admin/orders?scope=completed")
      ]);

      const nextToday = Array.isArray(today) ? today : [];
      const nextUpcoming = Array.isArray(upcoming) ? upcoming : [];
      const nextCompleted = Array.isArray(completed) ? completed : [];

      setTodayOrders(nextToday);
      setUpcomingOrders(nextUpcoming);
      setCompletedOrders(nextCompleted);

      setOpenUpcomingDates((current) => {
        const next = { ...current };
        for (const group of groupOrdersByDate(nextUpcoming)) {
          if (next[group.dateKey] === undefined) {
            next[group.dateKey] = true;
          }
        }
        return next;
      });

      setOpenCompletedDates((current) => {
        const next = { ...current };
        for (const group of groupOrdersByDate(nextCompleted)) {
          if (next[group.dateKey] === undefined) {
            next[group.dateKey] = true;
          }
        }
        return next;
      });
    } catch {
      setTodayOrders([]);
      setUpcomingOrders([]);
      setCompletedOrders([]);
    }
  }

  function toggleRow(id) {
    setExpandedId((current) => (current === id ? null : id));
  }

  function toggleActionMenu(orderId) {
    setActionMenuId((current) => (current === orderId ? null : orderId));
  }

  async function markDelivered(orderId) {
    setStatus("");
    try {
      await apiPatch(`/admin/orders/${orderId}`, { status: "COMPLETED" });
      setActionMenuId(null);
      setStatus("Order marked as delivered.");
      notify({ type: "success", message: "Order marked as delivered." });
      await loadOrders();
    } catch (error) {
      const message = error.message || "Unable to update order.";
      setStatus(message);
      notify({ type: "error", message });
    }
  }

  async function cancelOrder(orderId) {
    setStatus("");
    try {
      await apiPatch(`/admin/orders/${orderId}`, { status: "CANCELLED" });
      setActionMenuId(null);
      setStatus("Order cancelled.");
      notify({ type: "success", message: "Order cancelled." });
      await loadOrders();
    } catch (error) {
      const message = error.message || "Unable to cancel order.";
      setStatus(message);
      notify({ type: "error", message });
    }
  }

  function toggleUpcomingGroup(dateKey) {
    setOpenUpcomingDates((current) => ({
      ...current,
      [dateKey]: !current[dateKey]
    }));
  }

  function toggleCompletedGroup(dateKey) {
    setOpenCompletedDates((current) => ({
      ...current,
      [dateKey]: !current[dateKey]
    }));
  }

  const groupedUpcoming = groupOrdersByDate(upcomingOrders);
  const groupedCompleted = groupOrdersByDate(completedOrders);
  const activeTodayOrders = todayOrders.filter(
    (order) => !["COMPLETED", "CANCELLED"].includes(order.status)
  );
  const completedTodayOrders = todayOrders.filter((order) => order.status === "COMPLETED");

  return (
    <div>
      <header className="topbar">
        <div>
          <h1>Orders</h1>
          <p>View today, upcoming, and completed orders.</p>
        </div>
      </header>

      <div className="tabs">
        {ORDER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "tab-button active" : "tab-button"}
            onClick={() => {
              setActiveTab(tab.id);
              setExpandedId(null);
              setActionMenuId(null);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "today" && (
        <section className="sheet">
          <h2>Today's Orders</h2>
          <p className="status-text">Today's orders split into active and completed columns.</p>
          <div className="date-group">
            <button
              type="button"
              className="date-group-toggle"
              onClick={() => setOpenTodaySection((current) => !current)}
            >
              <span>{formatDateHeading(new Date())}</span>
              <span>{openTodaySection ? "Hide" : "Show"}</span>
            </button>
            {openTodaySection ? (
              <div className="today-orders-grid">
                <section className="sheet today-orders-panel">
                  <h3>Active Orders</h3>
                  <p className="status-text">Status is not completed or cancelled.</p>
                  <table className="responsive-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>Items</th>
                        <th>Total Qty</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <OrderRows
                        orders={activeTodayOrders}
                        expandedId={expandedId}
                        actionMenuId={actionMenuId}
                        onToggle={toggleRow}
                        onToggleActionMenu={toggleActionMenu}
                        showActions
                        onMarkDelivered={markDelivered}
                        onCancelOrder={cancelOrder}
                      />
                    </tbody>
                  </table>
                  {!activeTodayOrders.length ? <p className="empty">No active orders for today.</p> : null}
                </section>

                <section className="sheet today-orders-panel">
                  <h3>Today's Completed</h3>
                  <p className="status-text">Orders already marked delivered today.</p>
                  <table className="responsive-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>Items</th>
                        <th>Total Qty</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <OrderRows
                        orders={completedTodayOrders}
                        expandedId={expandedId}
                        actionMenuId={actionMenuId}
                        onToggle={toggleRow}
                        onToggleActionMenu={toggleActionMenu}
                      />
                    </tbody>
                  </table>
                  {!completedTodayOrders.length ? (
                    <p className="empty">No completed orders for today.</p>
                  ) : null}
                </section>
              </div>
            ) : null}
          </div>
          {!todayOrders.length ? <p className="empty">No orders for today.</p> : null}
        </section>
      )}

      {activeTab === "upcoming" && (
        <section className="sheet">
          <h2>Upcoming Orders</h2>
          <p className="status-text">Future orders grouped by date.</p>
          <div className="date-groups">
            {groupedUpcoming.map((group) => (
              <div key={group.dateKey} className="date-group">
                <button
                  type="button"
                  className="date-group-toggle"
                  onClick={() => toggleUpcomingGroup(group.dateKey)}
                >
                  <span>{group.label}</span>
                  <span>{openUpcomingDates[group.dateKey] ? "Hide" : "Show"}</span>
                </button>
                {openUpcomingDates[group.dateKey] ? (
                  <table className="responsive-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>Items</th>
                        <th>Total Qty</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <OrderRows
                        orders={group.items}
                        expandedId={expandedId}
                        actionMenuId={actionMenuId}
                        onToggle={toggleRow}
                        onToggleActionMenu={toggleActionMenu}
                      />
                    </tbody>
                  </table>
                ) : null}
              </div>
            ))}
          </div>
          {!groupedUpcoming.length ? <p className="empty">No upcoming orders found.</p> : null}
        </section>
      )}

      {activeTab === "completed" && (
        <section className="sheet">
          <h2>Completed Orders</h2>
          <p className="status-text">Completed orders grouped by date.</p>
          <div className="date-groups">
            {groupedCompleted.map((group) => (
              <div key={group.dateKey} className="date-group">
                <button
                  type="button"
                  className="date-group-toggle"
                  onClick={() => toggleCompletedGroup(group.dateKey)}
                >
                  <span>{group.label}</span>
                  <span>{openCompletedDates[group.dateKey] ? "Hide" : "Show"}</span>
                </button>
                {openCompletedDates[group.dateKey] ? (
                  <table className="responsive-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>Items</th>
                        <th>Total Qty</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <OrderRows
                        orders={group.items}
                        expandedId={expandedId}
                        actionMenuId={actionMenuId}
                        onToggle={toggleRow}
                        onToggleActionMenu={toggleActionMenu}
                      />
                    </tbody>
                  </table>
                ) : null}
              </div>
            ))}
          </div>
          {!groupedCompleted.length ? <p className="empty">No completed orders found.</p> : null}
        </section>
      )}

      {status ? <p className="empty">{status}</p> : null}
    </div>
  );
}
