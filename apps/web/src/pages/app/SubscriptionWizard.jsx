import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../../services/api.js";
import { datesBetween, toDateString } from "../../utils/date.js";
import AddressFormFields, {
  createEmptyAddress,
  formatAddressSummary,
  validateAddress
} from "../../components/AddressFormFields.jsx";

export default function SubscriptionWizard({ user }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [status, setStatus] = useState("");
  const [addressForm, setAddressForm] = useState(createEmptyAddress());
  const [placedPlan, setPlacedPlan] = useState(null);

  const [form, setForm] = useState({
    productId: "",
    startDate: toDateString(new Date()),
    endDate: toDateString(new Date()),
    mode: "EVERYDAY",
    quantity: 1,
    addressId: ""
  });
  const [selectedDates, setSelectedDates] = useState({});

  useEffect(() => {
    loadData();
  }, [user.id]);

  useEffect(() => {
    if (!placedPlan?.id) return undefined;

    const timeoutId = window.setTimeout(() => {
      navigate(`/app/subscriptions/${placedPlan.id}`);
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [navigate, placedPlan]);

  async function loadData() {
    try {
      const [productData, addressData] = await Promise.all([
        apiGet("/products"),
        apiGet(`/users/${user.id}/addresses`)
      ]);
      setProducts(Array.isArray(productData) ? productData : []);
      const addrList = Array.isArray(addressData) ? addressData : [];
      setAddresses(addrList);
      if (addrList.length && !form.addressId) {
        setForm((prev) => ({ ...prev, addressId: addrList[0].id }));
      }
    } catch {
      setProducts([]);
      setAddresses([]);
    }
  }

  function resetAddressForm() {
    setAddressForm(createEmptyAddress());
  }

  async function addAddress(event) {
    event.preventDefault();
    setStatus("");
    const validation = validateAddress(addressForm);
    if (validation) {
      setStatus(validation);
      return;
    }
    try {
      const payload = { ...addressForm };
      const saved = await apiPost(`/users/${user.id}/addresses`, payload);
      setAddresses((current) => [saved, ...current]);
      setForm((prev) => ({ ...prev, addressId: saved.id }));
      resetAddressForm();
      setShowAddressModal(false);
    } catch {
      setStatus("Unable to save address.");
    }
  }

  const selectedProduct = useMemo(
    () => products.find((p) => p._id === form.productId),
    [products, form.productId]
  );

  const totalDays = useMemo(() => {
    const days = datesBetween(form.startDate, form.endDate);
    if (form.mode === "EVERYDAY") return days.length;
    return days.filter((date) => selectedDates[toDateString(date)]).length;
  }, [form.startDate, form.endDate, form.mode, selectedDates]);

  const customCalendar = useMemo(
    () =>
      datesBetween(form.startDate, form.endDate).map((date) => {
        const key = toDateString(date);
        return {
          date,
          key,
          active: Boolean(selectedDates[key])
        };
      }),
    [form.startDate, form.endDate, selectedDates]
  );

  const estimate = selectedProduct
    ? totalDays * selectedProduct.price * (Number(form.quantity) || 1)
    : 0;

  function nextStep() {
    setStatus("");
    setStep((s) => Math.min(4, s + 1));
  }

  function prevStep() {
    setStatus("");
    setStep((s) => Math.max(1, s - 1));
  }

  function toggleCustomDate(dateKey) {
    setSelectedDates((current) => ({
      ...current,
      [dateKey]: !current[dateKey]
    }));
  }

  async function submitPlan() {
    setStatus("");

    if (!form.productId) {
      setStatus("Select a product.");
      return;
    }
    if (!form.addressId) {
      setStatus("Select an address.");
      return;
    }

    const payload = {
      productId: form.productId,
      startDate: form.startDate,
      endDate: form.endDate,
      mode: form.mode,
      addressId: form.addressId,
      defaultQuantity: Number(form.quantity) || 1
    };

    if (form.mode === "CUSTOM") {
      const days = customCalendar
        .filter((item) => item.active)
        .map((item) => ({
          date: item.key,
          quantity: Number(form.quantity) || 1,
          addressId: form.addressId
        }));

      if (!days.length) {
        setStatus("Select at least one delivery date on the calendar.");
        return;
      }

      payload.days = days;
    }

    try {
      const plan = await apiPost(`/users/${user.id}/plans`, payload);
      setStatus("");
      setPlacedPlan(plan);
    } catch {
      setStatus("Unable to create subscription. Check API.");
    }
  }


 


  return (
    <section className="section-card">
      <p className="section-kicker">Start Subscription</p>
      <h2>Step {step} of 4</h2>

      {step === 1 && (
        <div className="wizard-step">
          <h3>Select product</h3>
          <div className="products">
            {products.map((product) => (
              <button
                key={product._id}
                className={
                  form.productId === product._id ? "product selected" : "product"
                }
                onClick={() => setForm((prev) => ({ ...prev, productId: product._id }))}
              >
                <h4>{product.name}</h4>
                <p>{product.description || "Fresh dairy item."}</p>
                <p className="price">INR {product.price} / {product.unit}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="wizard-step">
          <h3>Choose dates & quantity</h3>
          <div className="field-row">
            <label className="field">
              <span>Start Date</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>End Date</span>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span>Quantity</span>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>Mode</span>
              <select
                value={form.mode}
                onChange={(e) => setForm((prev) => ({ ...prev, mode: e.target.value }))}
              >
                <option value="EVERYDAY">Every day</option>
                <option value="CUSTOM">Custom dates</option>
              </select>
            </label>
          </div>
          {form.mode === "CUSTOM" && (
            <div className="field">
              <span>Choose exact delivery dates</span>
              <div className="calendar">
                {customCalendar.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={item.active ? "cal-day" : "cal-day off"}
                    onClick={() => toggleCustomDate(item.key)}
                    title="Click to add or remove this delivery date."
                  >
                    <span>{new Date(item.date).getDate()}</span>
                    <span className="dot" />
                    <small>{item.active ? "Selected" : "Skip"}</small>
                  </button>
                ))}
              </div>
              <p className="empty-state">
                Click only the dates you want delivered for this custom subscription.
              </p>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="wizard-step">
          <h3>Select address</h3>
          <div className="grid address-grid">
            {addresses.map((addr) => (
              <button
                key={addr.id}
                type="button"
                className={
                  form.addressId === addr.id ? "address-card selected" : "address-card"
                }
                onClick={() => setForm((prev) => ({ ...prev, addressId: addr.id }))}
              >
                <strong>{addr.title}</strong>
                <p>{formatAddressSummary(addr)}</p>
                <p>
                  {addr.city}, {addr.state} {addr.postalCode}
                </p>
              </button>
            ))}
            <button
              type="button"
              className="address-card address-add-card"
              onClick={() => {
                setStatus("");
                setShowAddressModal(true);
              }}
            >
              <span className="address-add-icon">+</span>
              <strong>Add new address</strong>
              <p>Save another delivery location</p>
            </button>
          </div>

          {showAddressModal && (
            <div
              className="modal-overlay"
              onClick={() => {
                setShowAddressModal(false);
                resetAddressForm();
              }}
            >
              <div
                className="modal-card"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="modal-head">
                  <div>
                    <p className="section-kicker">Address</p>
                    <h3>Add new address</h3>
                  </div>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setShowAddressModal(false);
                      resetAddressForm();
                    }}
                  >
                    Close
                  </button>
                </div>

                <form className="address-form" onSubmit={addAddress}>
                  <AddressFormFields value={addressForm} onChange={setAddressForm} />
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => {
                        setShowAddressModal(false);
                        resetAddressForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button className="primary" type="submit">
                      Save Address
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="wizard-step">
          <h3>Confirm & pay</h3>
          <div className="summary-card">
            <p>Product: {selectedProduct?.name ||"-"}</p>
            <p>
              Dates: {form.startDate} to {form.endDate} 
            </p>
            <p>
            Total days: {totalDays}
            </p>
            <p>Per Dayn Quantity: {form.quantity}</p>
            <p>
              Total Quantity: {totalDays * (Number(form.quantity) || 1)}
            </p>
            <p>Estimated total: INR {estimate.toFixed(0)}</p>
          </div>
          <button className="primary" style={{marginTop: "20px"}} onClick={submitPlan}>
            Cash On Delivery & Place Order
          </button>
        </div>
      )}

      <div className="wizard-actions">
        <button className="ghost" onClick={prevStep} disabled={step === 1}>
          Back
        </button>
        {step < 4 && (
          <button className="primary" onClick={nextStep}>
            Next
          </button>
        )}
      </div>
      {status && <p className="message">{status}</p>}
      {placedPlan ? (
        <div className="modal-overlay" onClick={() => navigate(`/app/subscriptions/${placedPlan.id}`)}>
          <div className="modal-card order-success-card" onClick={(event) => event.stopPropagation()}>
            <div className="success-tick" aria-hidden="true">
              <svg viewBox="0 0 52 52">
                <circle className="success-tick-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="success-tick-check" fill="none" d="M14 27 22 35 38 18" />
              </svg>
            </div>
            <p className="section-kicker">Subscription Placed</p>
            <h3>Your subscription is active now.</h3>
            <p className="message">
              {selectedProduct?.name || "Subscription"} has been created and linked orders are being
              prepared. Taking you to subscription details now.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
