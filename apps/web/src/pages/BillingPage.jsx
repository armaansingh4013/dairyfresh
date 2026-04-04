import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../services/api.js";

export default function BillingPage({ user }) {
  const [invoices, setInvoices] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadInvoices();
  }, [user.id]);

  async function loadInvoices() {
    try {
      const data = await apiGet(`/users/${user.id}/invoices`);
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      setInvoices([]);
    }
  }

  async function payInvoice(invoiceId) {
    setStatus("");
    try {
      await apiPost(`/invoices/${invoiceId}/payments`, { provider: "UPI" });
      setStatus("Payment recorded.");
      loadInvoices();
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <section className="section-card">
      <p className="section-kicker">Billing</p>
      <h2>Invoices</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>
                {String(invoice.month).padStart(2, "0")}/{invoice.year}
              </td>
              <td>INR {invoice.totalAmount}</td>
              <td>{invoice.status}</td>
              <td>
                {invoice.status === "PAID" ? (
                  "Paid"
                ) : (
                  <button type="button" className="ghost" onClick={() => payInvoice(invoice.id)}>
                    Pay now
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!invoices.length && <p className="empty-state">No invoices yet.</p>}
      {status && <p className="message">{status}</p>}
    </section>
  );
}
