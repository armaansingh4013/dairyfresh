import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../services/api.js";
import { toDateString } from "../../utils/date.js";

function getProgress(plan) {
  const start = new Date(plan.startDate);
  const end = new Date(plan.endDate);
  const today = new Date();
  const total = Math.max(1, Math.ceil((end - start) / 86400000) + 1);
  const elapsed = Math.min(
    total,
    Math.max(0, Math.ceil((today - start) / 86400000) + 1)
  );
  const percent = Math.min(100, Math.round((elapsed / total) * 100));
  return { total, elapsed, percent };
}

export default function OngoingSubscriptionsPage({ user }) {
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadPlans();
  }, [user.id]);

  async function loadPlans() {
    try {
      const data = await apiGet(`/users/${user.id}/plans`);
      setPlans(Array.isArray(data) ? data : []);
    } catch {
      setPlans([]);
    }
  }

  const activePlans = useMemo(
    () => plans.filter((plan) => plan.status === "ACTIVE"),
    [plans]
  );

  return (
    <section className="section-card">
      <p className="section-kicker">Ongoing</p>
      <h2>Ongoing subscriptions</h2>
      {activePlans.length ? (
        <div className="grid">
          {activePlans.map((plan) => {
            const progress = getProgress(plan);
            return (
              <button
                key={plan.id}
                className="ongoing-card"
                onClick={() => setSelected(plan)}
              >
                <h3>{plan.product?.name || "Product"}</h3>
                <p>
                  {progress.elapsed}/{progress.total} days
                </p>
                <div className="progress">
                  <span style={{ width: `${progress.percent}%` }} />
                </div>
                <p>{progress.percent}% completed</p>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="empty-state">No ongoing subscriptions.</p>
      )}

      <div className="cta-row">
        <Link className="ghost" to="/app/subscriptions">
          Manage Subscriptions
        </Link>
      </div>

      {selected && (
        <div className="detail-panel">
          <h3>{selected.product?.name || "Product"}</h3>
          <p>
            {toDateString(selected.startDate)} to {toDateString(selected.endDate)}
          </p>
          <p>Mode: {selected.mode}</p>
          <p>Quantity: {selected.defaultQuantity}</p>
          <button className="ghost" onClick={() => setSelected(null)}>
            Close
          </button>
        </div>
      )}
    </section>
  );
}
