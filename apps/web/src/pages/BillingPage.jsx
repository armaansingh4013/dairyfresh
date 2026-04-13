import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../services/api.js";
import { useNotifications } from "../contexts/NotificationContext.jsx";

export default function BillingPage({ user }) {
  const [invoices, setInvoices] = useState([]);
  const [status, setStatus] = useState("");
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);
  const { notify } = useNotifications();

  useEffect(() => {
    loadInvoices();
  }, [user.id]);

  async function loadInvoices() {
    setLoadingInvoices(true);
    try {
      const data = await apiGet(`/users/${user.id}/invoices`);
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      setInvoices([]);
      notify({ type: "error", message: error.message || "Unable to load invoices." });
    } finally {
      setLoadingInvoices(false);
    }
  }

  async function payInvoice(invoiceId) {
    setStatus("");
    setPayingInvoiceId(invoiceId);
    try {
      await apiPost(`/invoices/${invoiceId}/payments`, { provider: "UPI" });
      setStatus("Payment recorded.");
      notify({ type: "success", message: "Payment recorded." });
      await loadInvoices();
    } catch (error) {
      setStatus(error.message);
      notify({ type: "error", message: error.message || "Unable to record payment." });
    } finally {
      setPayingInvoiceId(null);
    }
  }

  return (
    <section className="section-card">
      <p className="section-kicker">Billing</p>
      <h2>Invoices</h2>
      {loadingInvoices ? (
        <p className="inline-loader">
          <span className="button-spinner" aria-hidden="true" />
          Loading invoices...
        </p>
      ) : null}
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
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => payInvoice(invoice.id)}
                    disabled={payingInvoiceId === invoice.id}
                  >
                    {payingInvoiceId === invoice.id ? <span className="button-spinner" aria-hidden="true" /> : null}
                    {payingInvoiceId === invoice.id ? "Processing..." : "Pay now"}
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
