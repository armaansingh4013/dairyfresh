import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import ActionButton from "../../components/ActionButton";
import Badge from "../../components/Badge";
import Card from "../../components/Card";
import { colors } from "../../theme";
import { emptyAddressForm } from "./constants";
import { buildCalendarCells } from "./utils";
import { styles } from "./styles";

const DEFAULT_COORDINATE = {
  latitude: 12.9716,
  longitude: 77.5946
};

const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

export function AppHeader({ activeTab, activeView, cartCount, onBack, onOpenCart }) {
  const title =
    activeView.name === "cart"
      ? "Cart"
      : activeView.name === "subscriptionWizard"
        ? "Start Subscription"
        : activeView.name === "subscriptionDetail"
          ? "Subscription"
          : activeTab === "subscriptions"
            ? "Subscriptions"
            : activeTab === "orders"
              ? "Orders"
              : activeTab === "profile"
                ? "Profile"
                : "Mazara Dairy";

  const subtitle =
    activeView.name === "root"
      ? "Fresh dairy delivery"
      : "Mobile app aligned to the web flow";

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {activeView.name !== "root" ? (
            <Pressable onPress={onBack} style={styles.backButton}>
              <Text style={styles.backLabel}>Back</Text>
            </Pressable>
          ) : null}
          <View>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <Pressable onPress={onOpenCart} style={styles.headerCart}>
          <Text style={styles.headerCartLabel}>Cart</Text>
          {cartCount ? <Badge>{cartCount}</Badge> : null}
        </Pressable>
      </View>
    </View>
  );
}

export function AddressFormModal({ visible, onClose, onSubmit, saving = false }) {
  const [form, setForm] = useState(emptyAddressForm);

  useEffect(() => {
    if (!visible) {
      setForm(emptyAddressForm);
    }
  }, [visible]);

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.sectionTitle}>Add Address</Text>
          <Text style={styles.cardBody}>
            Fill in the delivery details below, then place the pin on the map for the exact location.
          </Text>
          <ScrollView
            style={styles.modalScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <AddressForm
              form={form}
              onChange={setForm}
              onSubmit={() => onSubmit(form)}
              saving={saving}
            />
          </ScrollView>
          <ActionButton tone="ghost" onPress={onClose} disabled={saving}>
            Close
          </ActionButton>
        </View>
      </View>
    </Modal>
  );
}

function AddressForm({ form, onChange, onSubmit, saving = false }) {
  const [showMap, setShowMap] = useState(false);
  const [loadingMap, setLoadingMap] = useState(false);
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
  const [mapVersion, setMapVersion] = useState(0);

  useEffect(() => {
    if (typeof form.lat === "number" && typeof form.lng === "number") {
      setShowMap(true);
    }
  }, [form.lat, form.lng]);

  useEffect(() => {
    let active = true;

    async function loadCurrentLocation() {
      if (typeof form.lat === "number" && typeof form.lng === "number") {
        return;
      }

      setLoadingCurrentLocation(true);
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!active || permission.status !== "granted") {
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });

        if (!active) return;

        onChange((currentForm) => ({
          ...currentForm,
          lat: current.coords.latitude,
          lng: current.coords.longitude
        }));
      } catch {
      } finally {
        if (active) {
          setLoadingCurrentLocation(false);
        }
      }
    }

    loadCurrentLocation();

    return () => {
      active = false;
    };
  }, [form.lat, form.lng, onChange]);

  async function handleOpenMap() {
    setLoadingMap(true);
    try {
      const coordinates = await geocodeAddress(form);
      if (coordinates) {
        onChange((current) => ({ ...current, ...coordinates }));
      }
      setShowMap(true);
      setMapVersion((current) => current + 1);
    } finally {
      setLoadingMap(false);
    }
  }

  return (
    <View style={styles.stack}>
      <Field compact label="Title" value={form.title} onChangeText={(value) => onChange((current) => ({ ...current, title: value }))} />
      <Field compact label="Name" value={form.recipientName} onChangeText={(value) => onChange((current) => ({ ...current, recipientName: value }))} />
      <Field compact label="Number" value={form.recipientPhone} onChangeText={(value) => onChange((current) => ({ ...current, recipientPhone: value }))} />
      <Field compact label="House no." value={form.houseNumber} onChangeText={(value) => onChange((current) => ({ ...current, houseNumber: value }))} />
      <Field compact label="Line 1" value={form.line1} onChangeText={(value) => onChange((current) => ({ ...current, line1: value }))} />
      <Field compact label="Line 2" value={form.line2} onChangeText={(value) => onChange((current) => ({ ...current, line2: value }))} />
      <Field compact label="Landmark" value={form.landmark} onChangeText={(value) => onChange((current) => ({ ...current, landmark: value }))} />
      <Field compact label="City" value={form.city} onChangeText={(value) => onChange((current) => ({ ...current, city: value }))} />
      <Field compact label="State" value={form.state} onChangeText={(value) => onChange((current) => ({ ...current, state: value }))} />
      <Field compact label="Postal code" value={form.postalCode} onChangeText={(value) => onChange((current) => ({ ...current, postalCode: value }))} />
      <ActionButton
        tone="ghost"
        onPress={handleOpenMap}
        loading={loadingMap || loadingCurrentLocation}
        loadingLabel="Opening map..."
      >
        {showMap ? "Recenter Map From Address" : "Open Map From Entered Address"}
      </ActionButton>
      {showMap ? (
        <LocationPicker
          mapVersion={mapVersion}
          value={form}
          onChange={(nextValue) => onChange((current) => ({ ...current, ...nextValue }))}
        />
      ) : null}
      <ActionButton onPress={onSubmit} loading={saving} loadingLabel="Saving address...">
        Save Address
      </ActionButton>
    </View>
  );
}

function LocationPicker({ mapVersion, onChange, value }) {
  const hasPin = typeof value.lat === "number" && typeof value.lng === "number";
  const mapRef = useRef(null);

  const markerCoordinate = useMemo(
    () => ({
      latitude: hasPin ? value.lat : DEFAULT_COORDINATE.latitude,
      longitude: hasPin ? value.lng : DEFAULT_COORDINATE.longitude
    }),
    [hasPin, value.lat, value.lng]
  );

  const region = useMemo(
    () => ({
      ...markerCoordinate,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    }),
    [markerCoordinate]
  );

  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.animateToRegion(region, 250);
  }, [mapVersion, region]);

  async function updateLocation(event) {
    const coordinate = event?.nativeEvent?.coordinate || event;
    if (!coordinate) return;

    const nextValue = {
      lat: coordinate.latitude,
      lng: coordinate.longitude
    };

    const resolvedAddress = await reverseGeocodeCoordinate(nextValue);
    onChange(resolvedAddress ? { ...resolvedAddress, ...nextValue } : nextValue);
  }

  return (
    <View style={styles.locationPickerWrap}>
      <View style={styles.mapRow}>
        <Text style={styles.fieldLabel}>Pin Location</Text>
        {hasPin ? <Badge>Pin set</Badge> : null}
      </View>
      <Text style={styles.mapHint}>
        Tap the map or drag the pin to set the delivery point.
      </Text>
      <View style={styles.mapCard}>
        <MapView
          key={mapVersion}
          ref={mapRef}
          style={styles.mapView}
          initialRegion={region}
          onPress={updateLocation}
          zoomEnabled
          zoomTapEnabled
          scrollEnabled
          rotateEnabled
          pitchEnabled
        >
          <Marker coordinate={markerCoordinate} draggable onDragEnd={updateLocation} />
        </MapView>
      </View>
      <View style={styles.mapRow}>
        <Text style={styles.cardBody}>
          Lat: {hasPin ? value.lat.toFixed(6) : "-"} | Lng: {hasPin ? value.lng.toFixed(6) : "-"}
        </Text>
        {hasPin ? (
          <Pressable
            onPress={() =>
              Linking.openURL(
                `https://www.google.com/maps/search/?api=1&query=${value.lat},${value.lng}`
              )
            }
          >
            <Text style={styles.linkText}>Open in Maps</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

async function geocodeAddress(value) {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const query = [
    value.houseNumber,
    value.line1,
    value.line2,
    value.landmark,
    value.city,
    value.state,
    value.postalCode
  ]
    .filter(Boolean)
    .join(", ")
    .trim();

  if (!query || !apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `${GOOGLE_GEOCODE_URL}?address=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`
    );
    const payload = await response.json();
    const location = payload?.results?.[0]?.geometry?.location;

    if (
      payload?.status === "OK" &&
      typeof location?.lat === "number" &&
      typeof location?.lng === "number"
    ) {
      return {
        lat: location.lat,
        lng: location.lng
      };
    }
  } catch {}

  return null;
}

function getAddressComponent(components, type) {
  return components.find((component) => component.types.includes(type))?.long_name || "";
}

async function reverseGeocodeCoordinate({ lat, lng }) {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (typeof lat !== "number" || typeof lng !== "number" || !apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `${GOOGLE_GEOCODE_URL}?latlng=${encodeURIComponent(`${lat},${lng}`)}&key=${encodeURIComponent(apiKey)}`
    );
    const payload = await response.json();
    const first = payload?.results?.[0];
    const components = first?.address_components || [];

    if (payload?.status !== "OK" || !first) {
      return null;
    }

    return {
      houseNumber: getAddressComponent(components, "street_number"),
      line1: getAddressComponent(components, "route"),
      city:
        getAddressComponent(components, "locality") ||
        getAddressComponent(components, "sublocality_level_1") ||
        getAddressComponent(components, "administrative_area_level_2"),
      state: getAddressComponent(components, "administrative_area_level_1"),
      postalCode: getAddressComponent(components, "postal_code")
    };
  } catch {}

  return null;
}

export function TabRow({ tabs, activeTab, onChange }) {
  return (
    <View style={styles.tabRow}>
      {tabs.map((tab) => (
        <Pressable
          key={tab}
          onPress={() => onChange(tab)}
          style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
        >
          <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Field({ compact = false, label, value, onChangeText, placeholder }) {
  return (
    <View style={[styles.fieldWrap, compact && styles.compactFieldWrap]}>
      {label ? <Text style={[styles.fieldLabel, compact && styles.compactFieldLabel]}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[styles.fieldInput, compact && styles.compactFieldInput]}
      />
    </View>
  );
}

export function CalendarField({ label, value, onChange }) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable style={styles.fieldWrap} onPress={() => setVisible(true)}>
        {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
        <View style={styles.calendarFieldInput}>
          <Text style={styles.calendarFieldValue}>{value}</Text>
          <Text style={styles.calendarFieldHint}>Pick</Text>
        </View>
      </Pressable>
      <CalendarModal
        visible={visible}
        value={value}
        onClose={() => setVisible(false)}
        onSelect={(nextValue) => {
          onChange(nextValue);
          setVisible(false);
        }}
      />
    </>
  );
}

function CalendarModal({ visible, value, onClose, onSelect }) {
  const [cursor, setCursor] = useState(() => {
    const base = value ? new Date(value) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    if (visible) {
      const base = value ? new Date(value) : new Date();
      setCursor(new Date(base.getFullYear(), base.getMonth(), 1));
    }
  }, [value, visible]);

  const cells = useMemo(() => buildCalendarCells(cursor), [cursor]);

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.summaryRow}>
              <SmallPillButton label="‹" onPress={() => setCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} />
              <Text style={styles.sectionTitle}>
                {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </Text>
              <SmallPillButton label="›" onPress={() => setCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} />
            </View>
            <View style={styles.calendarWeekRow}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <Text key={day} style={styles.calendarWeekLabel}>{day}</Text>
              ))}
            </View>
            <View style={styles.calendarMonthGrid}>
              {cells.map((cell, index) =>
                cell ? (
                  <Pressable
                    key={`${cell.key}-${index}`}
                    style={[
                      styles.calendarPickerDay,
                      cell.key === value && styles.calendarPickerDayActive
                    ]}
                    onPress={() => onSelect(cell.key)}
                  >
                    <Text
                      style={[
                        styles.calendarPickerDayLabel,
                        cell.key === value && styles.calendarPickerDayLabelActive
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </Pressable>
                ) : (
                  <View key={`empty-${index}`} style={styles.calendarPickerEmpty} />
                )
              )}
            </View>
          </ScrollView>
          <ActionButton tone="ghost" onPress={onClose}>
            Close
          </ActionButton>
        </View>
      </View>
    </Modal>
  );
}

export function SmallPillButton({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.smallPillButton}>
      <Text style={styles.smallPillLabel}>{label}</Text>
    </Pressable>
  );
}

export function EmptyCard({ message }) {
  return (
    <Card>
      <Text style={styles.cardBody}>{message}</Text>
    </Card>
  );
}

export function AnimatedScreen({ children }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true
      })
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export function SuccessOverlay({ successState }) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!successState) return;
    scale.setValue(0.8);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true
      })
    ]).start();
  }, [opacity, scale, successState]);

  return (
    <Modal animationType="fade" transparent visible={Boolean(successState)}>
      <View style={styles.modalBackdrop}>
        <Animated.View style={[styles.successCard, { opacity, transform: [{ scale }] }]}>
          <View style={styles.successIcon}>
            <Text style={styles.successCheck}>✓</Text>
          </View>
          <Text style={styles.sectionEyebrow}>{successState?.title}</Text>
          <Text style={styles.sectionTitle}>{successState?.title}</Text>
          <Text style={styles.cardBodyCentered}>{successState?.body}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function ToastOverlay({ toast }) {
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;

    translateY.setValue(40);
    opacity.setValue(0);

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true
      })
    ]).start();
  }, [opacity, toast, translateY]);

  if (!toast) {
    return null;
  }

  const toneStyle =
    toast.type === "error"
      ? styles.toastError
      : toast.type === "success"
        ? styles.toastSuccess
        : styles.toastInfo;

  return (
    <View pointerEvents="none" style={styles.toastLayer}>
      <Animated.View style={[styles.toastCard, toneStyle, { opacity, transform: [{ translateY }] }]}>
        <Text style={styles.toastText}>{toast.message}</Text>
      </Animated.View>
    </View>
  );
}
