import React, { useEffect, useState } from "react";
import { apiGet } from "../services/api.js";

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    async function loadSummary() {
      try {
        setSummary(await apiGet("/admin/reports/summary"));
      } catch {
        setSummary(null);
      }
    }

    loadSummary();
  }, []);

  return (
    <section className="sheet">
      <h2>Reports</h2>
      <div className="report-grid">
        <div className="stat">
          <p>Daily Litres</p>
          <h3>{summary ? `${summary.dailyLitres} L` : "0 L"}</h3>
        </div>
        <div className="stat">
          <p>Active Subscribers</p>
          <h3>{summary ? summary.activeSubscribers : 0}</h3>
        </div>
        <div className="stat">
          <p>Retention</p>
          <h3>{summary ? `${summary.retention}%` : "0%"}</h3>
        </div>
      </div>
      <p className="empty">
        {summary
          ? `Delivered: ${summary.deliveredCount}, Pending: ${summary.pendingCount}, Paid revenue: INR ${summary.paidRevenue}.`
          : "Unable to load report metrics."}
      </p>
    </section>
  );
}
