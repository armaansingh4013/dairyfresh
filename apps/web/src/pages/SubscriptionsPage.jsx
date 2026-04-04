import React, { useEffect, useMemo, useState } from "react";
import { loadUserPlans, PlanCard, SubscriptionPageNav } from "./app/subscriptionViews.jsx";

export default function SubscriptionsPage({ user }) {
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

  const activePlans = useMemo(
    () => plans.filter((plan) => plan.status === "ACTIVE"),
    [plans]
  );

  return (
    <div className="page-section">
      <section className="section-card">
        <p className="section-kicker">Subscriptions</p>
        <h2>Active Subscriptions</h2>
        <SubscriptionPageNav />
        {activePlans.length ? (
          activePlans.map((plan) => <PlanCard key={plan.id} plan={plan} showEdit />)
        ) : (
          <p className="empty-state">No active subscriptions.</p>
        )}
      </section>
    </div>
  );
}
