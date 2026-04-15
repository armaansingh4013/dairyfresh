import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Text,
  View
} from "react-native";
import BottomNav from "../components/BottomNav";
import LoginScreen from "../features/auth/LoginScreen";
import { apiGetCached, apiPost, invalidateCache } from "../services/api";
import {
  clearCart,
  clearSession,
  loadCart,
  loadSession,
  saveCart,
  saveSession
} from "../services/cache";
import { colors } from "../theme";
import { tabs } from "./mobileApp/constants";
import {
  AppHeader,
  SuccessOverlay,
  ToastOverlay
} from "./mobileApp/shared";
import {
  CartScreen,
  OrdersScreen,
  ProfileScreen,
  ShopScreen,
  SubscriptionDetailScreen,
  SubscriptionsScreen,
  SubscriptionWizardScreen
} from "./mobileApp/screens";
import { styles } from "./mobileApp/styles";
import {
  buildSubscriptionGroups,
  normalizeProducts,
  sanitizeAddress
} from "./mobileApp/utils";

export default function MobileApp() {
  const [booting, setBooting] = useState(true);
  const [activeTab, setActiveTab] = useState("shop");
  const [activeView, setActiveView] = useState({ name: "root", params: {} });
  const [session, setSession] = useState(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [appLoading, setAppLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [successState, setSuccessState] = useState(null);
  const [toast, setToast] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [creatingSubscription, setCreatingSubscription] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const userId = session?.user?.id || null;

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    saveCart(cartItems);
  }, [cartItems]);

  useEffect(() => {
    if (!toast) return undefined;

    const timeoutId = setTimeout(() => {
      setToast(null);
    }, 2600);

    return () => clearTimeout(timeoutId);
  }, [toast]);

  async function bootstrap() {
    const [storedSession, storedCart] = await Promise.all([loadSession(), loadCart()]);
    setSession(storedSession);
    setCartItems(Array.isArray(storedCart) ? storedCart : []);
    setBooting(false);

    if (storedSession?.user?.id) {
      refreshAppData(storedSession, { force: false });
    }
  }

  async function refreshAppData(sessionOverride = session, options = {}) {
    if (!sessionOverride?.user?.id) return;

    const token = sessionOverride.token;
    const currentUserId = sessionOverride.user.id;
    const force = Boolean(options.force);

    setAppLoading(true);
    try {
      const [productData, plansData, orderData, addressData] = await Promise.all([
        apiGetCached("/products", token, {
          key: "products",
          maxAgeMs: 5 * 60_000,
          force
        }),
        apiGetCached(`/users/${currentUserId}/plans`, token, {
          key: `plans:${currentUserId}`,
          maxAgeMs: 60_000,
          force
        }),
        apiGetCached(`/orders/users/${encodeURIComponent(currentUserId)}`, token, {
          key: `orders:${currentUserId}`,
          maxAgeMs: 30_000,
          force
        }),
        apiGetCached(`/users/${currentUserId}/addresses`, token, {
          key: `addresses:${currentUserId}`,
          maxAgeMs: 5 * 60_000,
          force
        })
      ]);

      setProducts(normalizeProducts(productData));
      setPlans(Array.isArray(plansData) ? plansData : []);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setAddresses(Array.isArray(addressData) ? addressData : []);
      setStatus("");
    } catch (error) {
      setStatus(error.message || "Unable to load app data.");
      showToast(error.message || "Unable to load app data.", "error");
    } finally {
      setAppLoading(false);
    }
  }

  async function handleRequestOtp() {
    setStatus("");

    if (!phone.trim()) {
      setStatus("Enter phone first.");
      return;
    }

    setOtpLoading(true);
    try {
      const payload = await apiPost("/auth/request-otp", { email: phone.trim() });
      setOtpRequested(true);
      setStatus(payload.message || "OTP sent.");
      showToast(payload.message || "OTP sent successfully.", "success");
    } catch (error) {
      setStatus(error.message);
      showToast(error.message || "Unable to send OTP.", "error");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleLogin() {
    setStatus("");
    if (!phone.trim() || !otp.trim()) {
      setStatus("Enter phone and OTP.");
      return;
    }

    setAuthLoading(true);
    try {
      const payload = await apiPost("/auth/verify-otp", {
        email: phone.trim(),
        otp: otp.trim()
      });
      setSession(payload);
      await saveSession(payload);
      setPhone("");
      setOtp("");
      setOtpRequested(false);
      setActiveTab("shop");
      setActiveView({ name: "root", params: {} });
      await refreshAppData(payload, { force: true });
      showToast("Logged in successfully.", "success");
    } catch (error) {
      setStatus(error.message);
      showToast(error.message || "Unable to sign in.", "error");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    setSession(null);
    setPlans([]);
    setOrders([]);
    setAddresses([]);
    setProducts([]);
    setCartItems([]);
    setStatus("");
    setActiveTab("shop");
    setActiveView({ name: "root", params: {} });
    await Promise.all([clearSession(), clearCart()]);
  }

  function openView(name, params = {}) {
    setActiveView({ name, params });
  }

  function closeView() {
    setActiveView({ name: "root", params: {} });
  }

  function showSuccess(config) {
    setSuccessState(config);
    if (config?.onDone) {
      setTimeout(() => {
        setSuccessState(null);
        config.onDone();
      }, config.durationMs || 1700);
    }
  }

  function showToast(message, type = "info") {
    if (!message) return;
    setToast({ message, type });
  }

  async function handlePlaceOrder({ addressId, date, note }) {
    if (!userId || !cartItems.length) {
      return;
    }

    setPlacingOrder(true);
    try {
      const order = await apiPost(
        "/orders",
        {
          userId,
          addressId,
          date,
          note,
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity || 0)
          }))
        },
        session.token
      );

      await invalidateCache([`orders:${userId}`]);
      setCartItems([]);
      await clearCart();
      await refreshAppData(session, { force: true });
      showSuccess({
        title: "Order placed",
        body: `Order #${order.id.slice(-6).toUpperCase()} has been confirmed.`,
        onDone: () => {
          closeView();
          setActiveTab("orders");
        }
      });
      showToast("Order placed successfully.", "success");
    } catch (error) {
      showToast(error.message || "Unable to place order.", "error");
      Alert.alert("Unable to place order", error.message);
    } finally {
      setPlacingOrder(false);
    }
  }

  async function handleCreateSubscription(payload, productName) {
    if (!userId) return;

    setCreatingSubscription(true);
    try {
      const plan = await apiPost(`/users/${userId}/plans`, payload, session.token);
      await invalidateCache([`plans:${userId}`, `orders:${userId}`]);
      await refreshAppData(session, { force: true });
      showToast("Subscription created successfully.", "success");
      showSuccess({
        title: "Subscription placed",
        body: `${productName || "Your subscription"} is active now.`,
        onDone: () => {
          setActiveTab("subscriptions");
          setActiveView({ name: "subscriptionDetail", params: { plan } });
        }
      });
    } catch (error) {
      showToast(error.message || "Unable to create subscription.", "error");
      Alert.alert("Unable to create subscription", error.message);
    } finally {
      setCreatingSubscription(false);
    }
  }

  async function handleSaveAddress(form, options = {}) {
    if (!userId) return null;

    const payload = sanitizeAddress(form);
    if (!payload.title || !payload.line1 || !payload.city || !payload.state || !payload.postalCode) {
      Alert.alert("Incomplete address", "Title, line 1, city, state, and postal code are required.");
      return null;
    }
    if (typeof payload.lat !== "number" || typeof payload.lng !== "number") {
      Alert.alert("Pin location required", "Place the marker on the map before saving the address.");
      return null;
    }

    setSavingAddress(true);
    try {
      const saved = await apiPost(`/users/${userId}/addresses`, payload, session.token);
      await invalidateCache([`addresses:${userId}`]);
      await refreshAppData(session, { force: true });
      showToast("Address saved.", "success");
      if (options.selectAfterSave) {
        return saved;
      }
      return saved;
    } catch (error) {
      showToast(error.message || "Unable to save address.", "error");
      Alert.alert("Unable to save address", error.message);
      return null;
    } finally {
      setSavingAddress(false);
    }
  }

  function updateCartItem(product, delta) {
    const productId = product.id || product._id;
    const existing = cartItems.find((item) => item.productId === productId);
    const nextQuantity = Math.max(0, Number((existing?.quantity || 0) + delta));

    if (nextQuantity === 0) {
      setCartItems((current) => current.filter((item) => item.productId !== productId));
      return;
    }

    const nextItem = {
      productId,
      name: product.name,
      price: Number(product.price || 0),
      unit: product.unit || "unit",
      quantity: nextQuantity
    };

    setCartItems((current) => {
      if (existing) {
        return current.map((item) => (item.productId === productId ? nextItem : item));
      }
      return [...current, nextItem];
    });
  }

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cartItems]
  );
  const cartTotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
        0
      ),
    [cartItems]
  );
  const subscriptions = useMemo(() => buildSubscriptionGroups(plans), [plans]);
  const ordersByPlanId = useMemo(() => {
    return orders.reduce((acc, order) => {
      if (!order.planId) return acc;
      if (!acc[order.planId]) acc[order.planId] = [];
      acc[order.planId].push(order);
      return acc;
    }, {});
  }, [orders]);

  if (booting) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.accentStrong} />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.shell}>
          <LoginScreen
            phone={phone}
            otp={otp}
            status={status}
            otpRequested={otpRequested}
            loading={authLoading}
            otpLoading={otpLoading}
            onChangePhone={setPhone}
            onChangeOtp={setOtp}
            onRequestOtp={handleRequestOtp}
            onLogin={handleLogin}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.shell}>
        <AppHeader
          activeView={activeView}
          activeTab={activeTab}
          cartCount={cartCount}
          onBack={closeView}
          onOpenCart={() => openView("cart")}
        />
        {appLoading ? (
          <View style={styles.loadingBanner}>
            <ActivityIndicator size="small" color={colors.accentStrong} />
            <Text style={styles.loadingBannerText}>Refreshing data...</Text>
          </View>
        ) : null}
        {status ? <Text style={styles.status}>{status}</Text> : null}
        <View style={styles.content}>
          {renderContent({
            activeTab,
            activeView,
            addresses,
            appLoading,
            cartCount,
            cartItems,
            cartTotal,
            creatingSubscription,
            onAddAddress: handleSaveAddress,
            onChangeTab: setActiveTab,
            onCreateSubscription: handleCreateSubscription,
            onLogout: handleLogout,
            onOpenSubscription: (plan) => openView("subscriptionDetail", { plan }),
            onOpenWizard: () => openView("subscriptionWizard"),
            onPlaceOrder: handlePlaceOrder,
            onRefresh: () => refreshAppData(session, { force: true }),
            onShowOrderSubscription: (planId) =>
              setActiveView({
                name: "subscriptionDetail",
                params: { plan: plans.find((item) => item.id === planId) || null }
              }),
            onUpdateCart: updateCartItem,
            orders,
            ordersByPlanId,
            placingOrder,
            products,
            savingAddress,
            session,
            subscriptions
          })}
        </View>
        {activeView.name === "root" ? (
          <BottomNav activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />
        ) : null}
      </View>
      <SuccessOverlay successState={successState} />
      <ToastOverlay toast={toast} />
    </SafeAreaView>
  );
}

function renderContent(props) {
  const { activeView } = props;

  if (activeView.name === "cart") {
    return (
      <CartScreen
        addresses={props.addresses}
        cartItems={props.cartItems}
        cartTotal={props.cartTotal}
        onAddAddress={props.onAddAddress}
        onPlaceOrder={props.onPlaceOrder}
        placingOrder={props.placingOrder}
        savingAddress={props.savingAddress}
      />
    );
  }

  if (activeView.name === "subscriptionWizard") {
    return (
      <SubscriptionWizardScreen
        addresses={props.addresses}
        onAddAddress={props.onAddAddress}
        onCreateSubscription={props.onCreateSubscription}
        products={props.products}
        creatingSubscription={props.creatingSubscription}
        savingAddress={props.savingAddress}
      />
    );
  }

  if (activeView.name === "subscriptionDetail") {
    return (
      <SubscriptionDetailScreen
        orders={props.ordersByPlanId[props.activeView.params.plan?.id] || []}
        plan={props.activeView.params.plan}
      />
    );
  }

  switch (props.activeTab) {
    case "subscriptions":
      return (
        <SubscriptionsScreen
          groups={props.subscriptions}
          onOpenSubscription={props.onOpenSubscription}
          onOpenWizard={props.onOpenWizard}
        />
      );
    case "orders":
      return (
        <OrdersScreen
          onOpenSubscription={props.onShowOrderSubscription}
          orders={props.orders}
        />
      );
    case "profile":
      return (
        <ProfileScreen
          addresses={props.addresses}
          onAddAddress={props.onAddAddress}
          onLogout={props.onLogout}
          savingAddress={props.savingAddress}
          session={props.session}
        />
      );
    case "shop":
    default:
      return (
        <ShopScreen
          appLoading={props.appLoading}
          cartCount={props.cartCount}
          onOpenSubscriptions={props.onChangeTab ? () => props.onChangeTab("subscriptions") : undefined}
          onOpenWizard={props.onOpenWizard}
          cartItems={props.cartItems}
          onUpdateCart={props.onUpdateCart}
          products={props.products}
          session={props.session}
        />
      );
  }
}
