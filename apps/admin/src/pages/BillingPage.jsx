import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../services/api.js";

export default function BillingPage() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [invoices, setInvoices] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadInvoices(String(now.getMonth() + 1), String(now.getFullYear()));
  }, []);

  async function loadInvoices(targetMonth = month, targetYear = year) {
    try {
      const data = await apiGet(`/admin/invoices?month=${targetMonth}&year=${targetYear}`);
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      setInvoices([]);
    }
  }

  async function generateInvoices() {
    setStatus("");
    try {
      const result = await apiPost(`/admin/invoices/generate?month=${month}&year=${year}`, {});
      setStatus(`Invoices generated. ${result.created || 0} records updated.`);
      loadInvoices();
    } catch {
      setStatus("Unable to generate invoices.");
    }
  }

  async function handleFilterSubmit(event) {
    event.preventDefault();
    setStatus("");
    loadInvoices();
  }

  return (
    <section className="sheet">
      <div className="topbar">
        <div>
          <h2>Billing</h2>
          <p className="status-text">Generate and review monthly invoices.</p>
        </div>
        <button type="button" onClick={generateInvoices}>
          Generate Invoices
        </button>
      </div>

      <form className="product-form" onSubmit={handleFilterSubmit}>
        <label>
          <span>Month</span>
          <input
            type="number"
            min="1"
            max="12"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
        </label>
        <label>
          <span>Year</span>
          <input
            type="number"
            min="2020"
            value={year}
            onChange={(event) => setYear(event.target.value)}
          />
        </label>
        <button type="submit">Load Billing</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Month</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Payments</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>{invoice.user?.name || invoice.user?.phone || "Customer"}</td>
              <td>
                {invoice.month}/{invoice.year}
              </td>
              <td>INR {invoice.totalAmount}</td>
              <td>{invoice.status}</td>
              <td>{invoice.payments?.length || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {!invoices.length && <p className="empty">No invoices for this month yet.</p>}
      {status && <p className="empty">{status}</p>}
    </section>
  );
}
