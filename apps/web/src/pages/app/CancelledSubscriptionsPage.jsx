import React, { useEffect, useMemo, useState } from "react";
import {
  loadUserPlans,
  PlanCard,
  SubscriptionPageNav
} from "./subscriptionViews.jsx";

export default function CancelledSubscriptionsPage({ user }) {
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

  const cancelledPlans = useMemo(
    () => plans.filter((plan) => plan.status === "CANCELLED"),
    [plans]
  );

  return (
    <div className="page-section">
      <section className="section-card">
        <p className="section-kicker">Subscriptions</p>
        <h2>Cancelled Subscriptions</h2>
        <SubscriptionPageNav />
        {cancelledPlans.length ? (
          cancelledPlans.map((plan) => <PlanCard key={plan.id} plan={plan} />)
        ) : (
          <p className="empty-state">No cancelled subscriptions.</p>
        )}
      </section>
    </div>
  );
}
