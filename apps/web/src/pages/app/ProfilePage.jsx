import React, { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "../../services/api.js";
import { useNotifications } from "../../contexts/NotificationContext.jsx";
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
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddressId, setSavingAddressId] = useState(null);
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const { notify } = useNotifications();

  useEffect(() => {
    loadDeliveries();
    loadAddresses();
  }, [user.id]);

  async function loadDeliveries() {
    setLoadingDeliveries(true);
    try {
      const data = await apiGet(`/users/${user.id}/deliveries`);
      setDeliveries(Array.isArray(data) ? data : []);
      setVisibleDeliveries(DELIVERY_BATCH_SIZE);
    } catch {
      setDeliveries([]);
      setVisibleDeliveries(DELIVERY_BATCH_SIZE);
    } finally {
      setLoadingDeliveries(false);
    }
  }

  async function loadAddresses() {
    setLoadingAddresses(true);
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
    } finally {
      setLoadingAddresses(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setStatus("");
    setSavingProfile(true);
    try {
      await apiPatch(`/users/${user.id}`, {
        name: profileForm.name,
        email: profileForm.email
      });
      setStatus("Profile updated.");
      notify({ type: "success", message: "Profile updated." });
    } catch (error) {
      const message = error.message || "Unable to update profile.";
      setStatus(message);
      notify({ type: "error", message });
    } finally {
      setSavingProfile(false);
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
    setSavingAddressId(addressId);
    try {
      await apiPatch(`/users/addresses/${addressId}`, edit);
      setStatus("Address updated.");
      setEditingAddressId(null);
      notify({ type: "success", message: "Address updated." });
      await loadAddresses();
    } catch (error) {
      const message = error.message || "Unable to update address.";
      setStatus(message);
      notify({ type: "error", message });
    } finally {
      setSavingAddressId(null);
    }
  }

  async function deleteAddress(addressId) {
    const confirmed = window.confirm("Delete this address?");
    if (!confirmed) return;

    setDeletingAddressId(addressId);
    try {
      await apiDelete(`/users/addresses/${addressId}`);
      setStatus("Address deleted.");
      if (editingAddressId === addressId) {
        setEditingAddressId(null);
      }
      notify({ type: "success", message: "Address deleted." });
      await loadAddresses();
    } catch (error) {
      const message = error.message || "Unable to delete address.";
      setStatus(message);
      notify({ type: "error", message });
    } finally {
      setDeletingAddressId(null);
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
    setAddingAddress(true);
    try {
      await apiPost(`/users/${user.id}/addresses`, newAddress);
      setNewAddress(createEmptyAddress());
      notify({ type: "success", message: "Address added." });
      await loadAddresses();
    } catch (error) {
      const message = error.message || "Unable to add address.";
      setStatus(message);
      notify({ type: "error", message });
    } finally {
      setAddingAddress(false);
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
        <button className="primary" type="submit" disabled={savingProfile}>
          {savingProfile ? <span className="button-spinner" aria-hidden="true" /> : null}
          {savingProfile ? "Saving profile..." : "Save Profile"}
        </button>
        {status && <p className="message">{status}</p>}
      </form>

      <h3>Saved addresses</h3>
      <form className="section-card address-form" onSubmit={addAddress}>
        <h4>Add new address</h4>
        <AddressFormFields value={newAddress} onChange={setNewAddress} />
        <button className="ghost" type="submit" disabled={addingAddress}>
          {addingAddress ? <span className="button-spinner" aria-hidden="true" /> : null}
          {addingAddress ? "Saving address..." : "Add Address"}
        </button>
      </form>
      {loadingAddresses ? (
        <p className="inline-loader">
          <span className="button-spinner" aria-hidden="true" />
          Loading saved addresses...
        </p>
      ) : null}
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
                disabled={deletingAddressId === addr.id}
              >
                {deletingAddressId === addr.id ? <span className="button-spinner" aria-hidden="true" /> : null}
                {deletingAddressId === addr.id ? "Deleting..." : "Delete"}
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

                <button
                  className="primary"
                  type="button"
                  onClick={() => saveAddress(addr.id)}
                  disabled={savingAddressId === addr.id}
                >
                  {savingAddressId === addr.id ? <span className="button-spinner" aria-hidden="true" /> : null}
                  {savingAddressId === addr.id ? "Saving address..." : "Save Address"}
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
            {loadingDeliveries ? (
              <p className="inline-loader">
                <span className="button-spinner" aria-hidden="true" />
                Loading delivered orders...
              </p>
            ) : null}
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
