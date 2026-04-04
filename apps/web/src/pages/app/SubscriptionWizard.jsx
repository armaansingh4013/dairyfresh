import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../../services/api.js";
import { datesBetween, toDateString } from "../../utils/date.js";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SubscriptionWizard({ user }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [status, setStatus] = useState("");
  const [addressForm, setAddressForm] = useState({
    title: "Home",
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    state: "",
    postalCode: "",
    isDefault: true
  });

  const [form, setForm] = useState({
    productId: "",
    startDate: toDateString(new Date()),
    endDate: toDateString(new Date()),
    mode: "EVERYDAY",
    quantity: 1,
    addressId: ""
  });
  const [planDays, setPlanDays] = useState({
    Mon: true,
    Tue: true,
    Wed: true,
    Thu: true,
    Fri: true,
    Sat: false,
    Sun: false
  });

  useEffect(() => {
    loadData();
  }, [user.id]);

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
    setAddressForm({
      title: "Home",
      line1: "",
      line2: "",
      landmark: "",
      city: "",
      state: "",
      postalCode: "",
      isDefault: true
    });
  }

  async function addAddress(event) {
    event.preventDefault();
    setStatus("");
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
    () => products.find((p) => p.id === form.productId),
    [products, form.productId]
  );

  const totalDays = useMemo(() => {
    const days = datesBetween(form.startDate, form.endDate);
    if (form.mode === "EVERYDAY") return days.length;
    const enabled = WEEKDAYS.filter((day) => planDays[day]);
    return days.filter((date) => enabled.includes(WEEKDAYS[date.getDay()])).length;
  }, [form.startDate, form.endDate, form.mode, planDays]);

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
      defaultQuantity: Number(form.quantity) || 1
    };

    if (form.mode === "CUSTOM") {
      const enabledDays = WEEKDAYS.filter((day) => planDays[day]);
      const days = datesBetween(form.startDate, form.endDate)
        .filter((date) => enabledDays.includes(WEEKDAYS[date.getDay()]))
        .map((date) => ({
          date: toDateString(date),
          quantity: Number(form.quantity) || 1,
          addressId: form.addressId
        }));

      payload.days = days;
    }

    try {
      await apiPost(`/users/${user.id}/plans`, payload);
      setStatus("Subscription placed.");
      navigate("/app/subscriptions");
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
                key={product.id}
                className={
                  form.productId === product.id ? "product selected" : "product"
                }
                onClick={() => setForm((prev) => ({ ...prev, productId: product.id }))}
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
                <option value="CUSTOM">Custom weekdays</option>
              </select>
            </label>
          </div>
          {form.mode === "CUSTOM" && (
            <div className="field">
              <span>Weekdays</span>
              <div className="days">
                {WEEKDAYS.map((day) => (
                  <label key={day} className={planDays[day] ? "day active" : "day"}>
                    <input
                      type="checkbox"
                      checked={planDays[day]}
                      onChange={() =>
                        setPlanDays((current) => ({
                          ...current,
                          [day]: !current[day]
                        }))
                      }
                    />
                    {day}
                  </label>
                ))}
              </div>
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
                <p>{addr.line1}</p>
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
                  <div className="field-row">
                    <label className="field">
                      <span>Title</span>
                      <input
                        value={addressForm.title}
                        onChange={(e) =>
                          setAddressForm((prev) => ({ ...prev, title: e.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>City</span>
                      <input
                        value={addressForm.city}
                        onChange={(e) =>
                          setAddressForm((prev) => ({ ...prev, city: e.target.value }))
                        }
                      />
                    </label>
                  </div>
                  <label className="field">
                    <span>Address Line 1</span>
                    <input
                      value={addressForm.line1}
                      onChange={(e) =>
                        setAddressForm((prev) => ({ ...prev, line1: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Address Line 2</span>
                    <input
                      value={addressForm.line2}
                      onChange={(e) =>
                        setAddressForm((prev) => ({ ...prev, line2: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Landmark</span>
                    <input
                      value={addressForm.landmark}
                      onChange={(e) =>
                        setAddressForm((prev) => ({ ...prev, landmark: e.target.value }))
                      }
                    />
                  </label>
                  <div className="field-row">
                    <label className="field">
                      <span>State</span>
                      <input
                        value={addressForm.state}
                        onChange={(e) =>
                          setAddressForm((prev) => ({ ...prev, state: e.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Postal Code</span>
                      <input
                        value={addressForm.postalCode}
                        onChange={(e) =>
                          setAddressForm((prev) => ({ ...prev, postalCode: e.target.value }))
                        }
                      />
                    </label>
                  </div>
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
            <p>Product: {selectedProduct?.name || "-"}</p>
            <p>
              Dates: {form.startDate} to {form.endDate}
            </p>
            <p>Quantity: {form.quantity}</p>
            <p>Estimated total: INR {estimate.toFixed(0)}</p>
          </div>
          <button className="primary" style={{marginTop: "20px"}} onClick={submitPlan}>
            Pay Now & Place Order
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
    </section>
  );
}
