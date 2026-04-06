import React, { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "../../services/api.js";
import AddressFormFields, {
  createEmptyAddress,
  formatAddressSummary,
  validateAddress
} from "../../components/AddressFormFields.jsx";

export default function ProfilePage({ user }) {
  const DELIVERY_BATCH_SIZE = 5;
  const [deliveries, setDeliveries] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [addressEdits, setAddressEdits] = useState({});
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [newAddress, setNewAddress] = useState(createEmptyAddress());
  const [showDeliveries, setShowDeliveries] = useState(false);
  const [visibleDeliveries, setVisibleDeliveries] = useState(DELIVERY_BATCH_SIZE);
  const [profileForm, setProfileForm] = useState({
    name: user.name || "",
    email: user.email || ""
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadDeliveries();
    loadAddresses();
  }, [user.id]);

  async function loadDeliveries() {
    try {
      const data = await apiGet(`/users/${user.id}/deliveries`);
      setDeliveries(Array.isArray(data) ? data : []);
      setVisibleDeliveries(DELIVERY_BATCH_SIZE);
    } catch {
      setDeliveries([]);
      setVisibleDeliveries(DELIVERY_BATCH_SIZE);
    }
  }

  async function loadAddresses() {
    try {
      const data = await apiGet(`/users/${user.id}/addresses`);
      const list = Array.isArray(data) ? data : [];
      setAddresses(list);
      setAddressEdits(
        Object.fromEntries(
          list.map((addr) => [
            addr.id,
            {
              title: addr.title,
              houseNumber: addr.houseNumber || "",
              line1: addr.line1,
              line2: addr.line2 || "",
              landmark: addr.landmark || "",
              city: addr.city,
              state: addr.state,
              postalCode: addr.postalCode,
              lat: addr.lat ?? null,
              lng: addr.lng ?? null,
              isDefault: Boolean(addr.isDefault)
            }
          ])
        )
      );
    } catch {
      setAddresses([]);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setStatus("");
    try {
      await apiPatch(`/users/${user.id}`, {
        name: profileForm.name,
        email: profileForm.email
      });
      setStatus("Profile updated.");
    } catch {
      setStatus("Unable to update profile.");
    }
  }

  async function saveAddress(addressId) {
    const edit = addressEdits[addressId];
    if (!edit) return;
    const validation = validateAddress(edit);
    if (validation) {
      setStatus(validation);
      return;
    }
    try {
      await apiPatch(`/users/addresses/${addressId}`, edit);
      setStatus("Address updated.");
      setEditingAddressId(null);
      loadAddresses();
    } catch {
      setStatus("Unable to update address.");
    }
  }

  async function deleteAddress(addressId) {
    const confirmed = window.confirm("Delete this address?");
    if (!confirmed) return;

    try {
      await apiDelete(`/users/addresses/${addressId}`);
      setStatus("Address deleted.");
      if (editingAddressId === addressId) {
        setEditingAddressId(null);
      }
      loadAddresses();
    } catch {
      setStatus("Unable to delete address.");
    }
  }

  async function addAddress(event) {
    event.preventDefault();
    setStatus("");
    const validation = validateAddress(newAddress);
    if (validation) {
      setStatus(validation);
      return;
    }
    try {
      await apiPost(`/users/${user.id}/addresses`, newAddress);
      setNewAddress(createEmptyAddress());
      loadAddresses();
    } catch {
      setStatus("Unable to add address.");
    }
  }

  const deliveredOnly = useMemo(
    () => deliveries.filter((delivery) => delivery.status === "DELIVERED"),
    [deliveries]
  );

  const displayedDeliveries = useMemo(
    () => deliveredOnly.slice(0, visibleDeliveries),
    [deliveredOnly, visibleDeliveries]
  );

  const hasMoreDeliveries = displayedDeliveries.length < deliveredOnly.length;

  return (
    <section className="section-card">
      <p className="section-kicker">Profile</p>
      <h2>Your details</h2>
      <div className="grid">
        <div className="feature">
          <h3>Name</h3>
          <p>{user.name || "Not set"}</p>
        </div>
        <div className="feature">
          <h3>Phone</h3>
          <p>{user.phone}</p>
        </div>
        <div className="feature">
          <h3>Email</h3>
          <p>{user.email || "Not set"}</p>
        </div>
      </div>

      <form className="section-card profile-form" onSubmit={saveProfile}>
        <h3>Edit profile</h3>
        <div className="field-row">
          <label className="field">
            <span>Name</span>
            <input
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              value={profileForm.email}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </label>
        </div>
        <button className="primary" type="submit">
          Save Profile
        </button>
        {status && <p className="message">{status}</p>}
      </form>

      <h3>Saved addresses</h3>
      <form className="section-card address-form" onSubmit={addAddress}>
        <h4>Add new address</h4>
        <AddressFormFields value={newAddress} onChange={setNewAddress} />
        <button className="ghost" type="submit">
          Add Address
        </button>
      </form>
      <div className="grid">
        {addresses.map((addr) => (
          <div key={addr.id} className="address-card profile-address">
            <div className="address-card-head">
              <div>
                <h4>{addr.title || "Address"}</h4>
                <p>
                  {formatAddressSummary(addr)}
                  <br />
                  {addr.city}, {addr.state} {addr.postalCode}
                </p>
              </div>
              {addr.isDefault && <span className="badge">Default</span>}
            </div>

            <div className="address-actions">
              <button
                className="ghost"
                type="button"
                onClick={() =>
                  setEditingAddressId((current) => (current === addr.id ? null : addr.id))
                }
              >
                {editingAddressId === addr.id ? "Cancel" : "Edit"}
              </button>
              <button
                className="ghost danger"
                type="button"
                onClick={() => deleteAddress(addr.id)}
              >
                Delete
              </button>
            </div>

            {editingAddressId === addr.id && (
              <div className="address-edit-form">
                <AddressFormFields
                  value={addressEdits[addr.id] || createEmptyAddress()}
                  onChange={(updater) =>
                    setAddressEdits((current) => ({
                      ...current,
                      [addr.id]:
                        typeof updater === "function"
                          ? updater(current[addr.id] || createEmptyAddress())
                          : updater
                    }))
                  }
                />

                <button className="primary" type="button" onClick={() => saveAddress(addr.id)}>
                  Save Address
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="delivery-history">
        <button
          className="ghost history-toggle"
          type="button"
          onClick={() => setShowDeliveries((current) => !current)}
        >
          {showDeliveries ? "Hide delivered orders" : "Show delivered orders"}
        </button>

        {showDeliveries && (
          <>
            {!!deliveredOnly.length && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedDeliveries.map((delivery) => (
                    <tr key={delivery.id}>
                      <td>{new Date(delivery.date).toLocaleDateString()}</td>
                      <td>{delivery.product?.name || "Product"}</td>
                      <td>
                        {delivery.quantity} {delivery.product?.unit || "L"}
                      </td>
                      <td>
                        INR{" "}
                        {Number(delivery.quantity || 0) *
                          Number(delivery.product?.price || 0)}
                      </td>
                      <td>{delivery.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!deliveredOnly.length && (
              <p className="empty-state">No delivered orders yet.</p>
            )}

            {hasMoreDeliveries && (
              <button
                className="primary"
                type="button"
                onClick={() =>
                  setVisibleDeliveries((current) => current + DELIVERY_BATCH_SIZE)
                }
              >
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
