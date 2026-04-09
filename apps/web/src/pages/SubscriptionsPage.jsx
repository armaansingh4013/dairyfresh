import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  buildDeliveredHistory,
  isCompletedPlan,
  loadUserPlans,
  PlanCard,
  SUBSCRIPTION_TABS,
  SubscriptionPageNav
} from "./app/subscriptionViews.jsx";

export default function SubscriptionsPage({ user }) {
  const [plans, setPlans] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || SUBSCRIPTION_TABS.ACTIVE;

  useEffect(() => {
    loadPlans();
  }, [user.id]);

  useEffect(() => {
    const validTabs = Object.values(SUBSCRIPTION_TABS);
    if (!validTabs.includes(currentTab)) {
      setSearchParams({});
    }
  }, [currentTab, setSearchParams]);

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
  const cancelledPlans = useMemo(
    () => plans.filter((plan) => plan.status === "CANCELLED"),
    [plans]
  );
  const completedPlans = useMemo(
    () => plans.filter((plan) => isCompletedPlan(plan)),
    [plans]
  );
  const deliveredHistory = useMemo(() => buildDeliveredHistory(plans), [plans]);

  const contentByTab = {
    [SUBSCRIPTION_TABS.ACTIVE]: {
      title: "Active Subscriptions",
      empty: "No active subscriptions.",
      content: activePlans.map((plan) => <PlanCard key={plan.id} plan={plan} showEdit />)
    },
    [SUBSCRIPTION_TABS.CANCELLED]: {
      title: "Cancelled Subscriptions",
      empty: "No cancelled subscriptions.",
      content: cancelledPlans.map((plan) => <PlanCard key={plan.id} plan={plan} />)
    },
    [SUBSCRIPTION_TABS.COMPLETED]: {
      title: "Completed Subscriptions",
      empty: "No completed subscriptions.",
      content: completedPlans.map((plan) => <PlanCard key={plan.id} plan={plan} />)
    },
    [SUBSCRIPTION_TABS.HISTORY]: {
      title: "Completed Order History",
      empty: "No completed orders yet.",
      content: deliveredHistory.map((group) => (
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
      ))
    }
  };

  const section = contentByTab[currentTab] || contentByTab[SUBSCRIPTION_TABS.ACTIVE];

  return (
    <div className="page-section">
      <section className="section-card">
        <p className="section-kicker">Subscriptions</p>
        <h2>{section.title}</h2>
        <SubscriptionPageNav />
        {section.content.length ? (
          currentTab === SUBSCRIPTION_TABS.HISTORY ? (
            <div className="history-groups">{section.content}</div>
          ) : (
            section.content
          )
        ) : (
          <p className="empty-state">{section.empty}</p>
        )}
      </section>
    </div>
  );
}
