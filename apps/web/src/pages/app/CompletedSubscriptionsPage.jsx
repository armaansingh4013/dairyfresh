import React, { useEffect, useMemo, useState } from "react";
import {
  isCompletedPlan,
  loadUserPlans,
  PlanCard,
  SubscriptionPageNav
} from "./subscriptionViews.jsx";

export default function CompletedSubscriptionsPage({ user }) {
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

  const completedPlans = useMemo(
    () => plans.filter((plan) => isCompletedPlan(plan)),
    [plans]
  );

  return (
    <div className="page-section">
      <section className="section-card">
        <p className="section-kicker">Subscriptions</p>
        <h2>Completed Subscriptions</h2>
        <SubscriptionPageNav />
        {completedPlans.length ? (
          completedPlans.map((plan) => <PlanCard key={plan.id} plan={plan} />)
        ) : (
          <p className="empty-state">No completed subscriptions.</p>
        )}
      </section>
    </div>
  );
}
