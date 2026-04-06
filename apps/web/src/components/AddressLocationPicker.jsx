import React, { useEffect, useMemo, useRef, useState } from "react";

const GOOGLE_MAPS_URL = "https://maps.googleapis.com/maps/api/js";
let googleMapsPromise;

function loadGoogleMaps(apiKey) {
  if (!apiKey) {
    return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${GOOGLE_MAPS_URL}?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google);
      script.onerror = () => reject(new Error("Unable to load Google Maps"));
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
}

function getAddressComponent(components, type) {
  return components.find((component) => component.types.includes(type))?.long_name || "";
}

function extractAddressPayload(placeResult, fallback = {}) {
  const components = placeResult.address_components || [];
  const location = placeResult.geometry?.location;

  return {
    houseNumber: getAddressComponent(components, "street_number") || fallback.houseNumber || "",
    line1: getAddressComponent(components, "route") || fallback.line1 || "",
    city:
      getAddressComponent(components, "locality") ||
      getAddressComponent(components, "sublocality_level_1") ||
      getAddressComponent(components, "administrative_area_level_2") ||
      fallback.city ||
      "",
    state: getAddressComponent(components, "administrative_area_level_1") || fallback.state || "",
    postalCode: getAddressComponent(components, "postal_code") || fallback.postalCode || "",
    lat: typeof location?.lat === "function" ? location.lat() : fallback.lat ?? null,
    lng: typeof location?.lng === "function" ? location.lng() : fallback.lng ?? null
  };
}

export default function AddressLocationPicker({ value, onChange }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const mapRef = useRef(null);
  const searchRef = useRef(null);
  const valueRef = useRef(value);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [loadError, setLoadError] = useState("");

  const center = useMemo(
    () =>
      typeof value.lat === "number" && typeof value.lng === "number"
        ? { lat: value.lat, lng: value.lng }
        : { lat: 12.9716, lng: 77.5946 },
    [value.lat, value.lng]
  );

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    let disposed = false;

    async function setupMap() {
      try {
        const google = await loadGoogleMaps(apiKey);
        if (disposed || !mapRef.current || !searchRef.current) {
          return;
        }

        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: typeof value.lat === "number" && typeof value.lng === "number" ? 17 : 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });

        const marker = new google.maps.Marker({
          map,
          position: center,
          draggable: true
        });

        const geocoder = new google.maps.Geocoder();
        const autocomplete = new google.maps.places.Autocomplete(searchRef.current, {
          fields: ["address_components", "geometry", "formatted_address"],
          types: ["geocode"]
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry?.location) {
            return;
          }

          const nextCenter = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };

          map.panTo(nextCenter);
          map.setZoom(17);
          marker.setPosition(nextCenter);
          onChange(extractAddressPayload(place, valueRef.current));
        });

        marker.addListener("dragend", async (event) => {
          const nextCenter = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };

          try {
            const response = await geocoder.geocode({ location: nextCenter });
            const first = response.results?.[0];
            if (first) {
              onChange(extractAddressPayload(first, { ...valueRef.current, ...nextCenter }));
              return;
            }
          } catch {}

          onChange(nextCenter);
        });

        map.addListener("click", async (event) => {
          const nextCenter = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };

          marker.setPosition(nextCenter);
          try {
            const response = await geocoder.geocode({ location: nextCenter });
            const first = response.results?.[0];
            if (first) {
              onChange(extractAddressPayload(first, { ...valueRef.current, ...nextCenter }));
              return;
            }
          } catch {}

          onChange(nextCenter);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
      } catch (error) {
        if (!disposed) {
          setLoadError(error.message || "Unable to load Google Maps.");
        }
      }
    }

    setupMap();

    return () => {
      disposed = true;
    };
  }, [apiKey]);

  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) {
      return;
    }

    mapInstanceRef.current.setCenter(center);
    markerRef.current.setPosition(center);
  }, [center]);

  return (
    <div className="location-picker">
      <div className="location-picker-head">
        <div>
          <span className="field-label">Exact Location</span>
          <p className="location-picker-copy">
            Search with Google Places, then drag the pin if the doorstep needs adjustment.
          </p>
        </div>
        {typeof value.lat === "number" && typeof value.lng === "number" ? (
          <span className="badge">Pin set</span>
        ) : null}
      </div>

      <input
        ref={searchRef}
        className="location-search"
        placeholder="Search area, street, building, or pincode"
      />

      {loadError ? (
        <p className="message">
          {loadError}. Add `VITE_GOOGLE_MAPS_API_KEY` in `apps/web/.env`.
        </p>
      ) : (
        <div ref={mapRef} className="location-map" />
      )}

      <div className="location-coordinates">
        <span>Lat: {typeof value.lat === "number" ? value.lat.toFixed(6) : "-"}</span>
        <span>Lng: {typeof value.lng === "number" ? value.lng.toFixed(6) : "-"}</span>
      </div>
    </div>
  );
}
