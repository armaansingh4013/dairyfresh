import React from "react";
import AddressLocationPicker from "./AddressLocationPicker.jsx";

export function createEmptyAddress() {
  return {
    title: "Home",
    houseNumber: "",
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    state: "",
    postalCode: "",
    lat: null,
    lng: null,
    isDefault: true
  };
}

export function validateAddress(address) {
  if (!address.title?.trim()) return "Enter an address title.";
  if (!address.houseNumber?.trim()) return "Enter house number.";
  if (!address.line1?.trim()) return "Enter address line 1.";
  if (!address.city?.trim()) return "Enter city.";
  if (!address.state?.trim()) return "Enter state.";
  if (!address.postalCode?.trim()) return "Enter pincode.";
  if (typeof address.lat !== "number" || typeof address.lng !== "number") {
    return "Pick the exact location on the map.";
  }
  return "";
}

export function formatAddressSummary(address) {
  return [address.houseNumber, address.line1, address.line2, address.landmark]
    .filter(Boolean)
    .join(", ");
}

export default function AddressFormFields({
  value,
  onChange,
  showDefaultToggle = true
}) {
  function setField(field, nextValue) {
    onChange((current) => ({ ...current, [field]: nextValue }));
  }

  return (
    <>
      <div className="field-row">
        <label className="field">
          <span>Title</span>
          <input value={value.title || ""} onChange={(e) => setField("title", e.target.value)} />
        </label>
        <label className="field">
          <span>House Number</span>
          <input
            value={value.houseNumber || ""}
            onChange={(e) => setField("houseNumber", e.target.value)}
          />
        </label>
      </div>

      <label className="field">
        <span>Address Line 1</span>
        <input value={value.line1 || ""} onChange={(e) => setField("line1", e.target.value)} />
      </label>

      <label className="field">
        <span>Address Line 2</span>
        <input value={value.line2 || ""} onChange={(e) => setField("line2", e.target.value)} />
      </label>

      <label className="field">
        <span>Landmark</span>
        <input
          value={value.landmark || ""}
          onChange={(e) => setField("landmark", e.target.value)}
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>City</span>
          <input value={value.city || ""} onChange={(e) => setField("city", e.target.value)} />
        </label>
        <label className="field">
          <span>State</span>
          <input value={value.state || ""} onChange={(e) => setField("state", e.target.value)} />
        </label>
        <label className="field">
          <span>Pincode</span>
          <input
            value={value.postalCode || ""}
            onChange={(e) => setField("postalCode", e.target.value)}
          />
        </label>
      </div>

      <AddressLocationPicker
        value={value}
        onChange={(next) => onChange((current) => ({ ...current, ...next }))}
      />

      {showDefaultToggle ? (
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={Boolean(value.isDefault)}
            onChange={(e) => setField("isDefault", e.target.checked)}
          />
          <span>Use as default address</span>
        </label>
      ) : null}
    </>
  );
}
