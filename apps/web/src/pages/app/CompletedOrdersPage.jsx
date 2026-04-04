import React, { useEffect, useMemo, useState } from "react";
import {
  buildDeliveredHistory,
  loadUserPlans,
  SubscriptionPageNav
} from "./subscriptionViews.jsx";

export default function CompletedOrdersPage({ user }) {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    loadPlans();
  }, [user.id]);

  async function loadPlans() {
    try {
      setPlans(await loadUserPlans(user.id));
    } catch {
      setPlans([]);
    }
  }

  const deliveredHistory = useMemo(() => buildDeliveredHistory(plans), [plans]);

  return (
    <div className="page-section">
      <section className="section-card">
        <p className="section-kicker">Subscriptions</p>
        <h2>Completed Order History</h2>
        <SubscriptionPageNav />
        {deliveredHistory.length ? (
          <div className="history-groups">
            {deliveredHistory.map((group) => (
              <details key={group.key} className="history-group" open>
                <summary className="history-summary">
                  <span>{group.label}</span>
                  <span>{group.items.length} delivered</span>
                </summary>
                <div className="history-items">
                  {group.items.map((item) => (
                    <article key={item.id} className="plan-card history-card">
                      <div>
                        <strong>{item.productName}</strong>
                        <p>
                          {item.quantity} {item.unit}
                        </p>
                        <p>Mode: {item.planMode}</p>
                      </div>
                      {item.address ? (
                        <div className="history-metrics">
                          <span>{item.address}</span>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className="empty-state">No completed orders yet.</p>
        )}
      </section>
    </div>
  );
}
