import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import ActionButton from "../components/ActionButton";
import Badge from "../components/Badge";
import BottomNav from "../components/BottomNav";
import Card from "../components/Card";
import LoginScreen from "../features/auth/LoginScreen";
import { apiGetCached, apiPatch, apiPost, invalidateCache } from "../services/api";
import {
  clearCart,
  clearSession,
  loadCart,
  loadSession,
  saveCart,
  saveSession
} from "../services/cache";
import { colors, radii, shadows, spacing } from "../theme";

const tabs = [
  { key: "shop", label: "Shop", icon: "S" },
  { key: "subscriptions", label: "Subs", icon: "U" },
  { key: "orders", label: "Orders", icon: "O" },
  { key: "profile", label: "Me", icon: "P" }
];

const subscriptionTabs = ["active", "cancelled", "completed", "history"];
const subscriptionOrderTabs = ["today", "upcoming", "completed"];
const emptyAddressForm = {
  title: "",
  houseNumber: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  postalCode: ""
};

export default function MobileApp() {
  const [booting, setBooting] = useState(true);
  const [activeTab, setActiveTab] = useState("shop");
  const [activeView, setActiveView] = useState({ name: "root", params: {} });
  const [session, setSession] = useState(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [appLoading, setAppLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [successState, setSuccessState] = useState(null);

  const userId = session?.user?.id || null;

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    saveCart(cartItems);
  }, [cartItems]);

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

    try {
      const payload = await apiPost("/auth/request-otp", { email: phone.trim() });
      setOtpRequested(true);
      setStatus(payload.message || "OTP sent.");
    } catch (error) {
      setStatus(error.message);
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
    } catch (error) {
      setStatus(error.message);
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

  async function handlePlaceOrder({ addressId, date, note }) {
    if (!userId || !cartItems.length) {
      return;
    }

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
    } catch (error) {
      Alert.alert("Unable to place order", error.message);
    }
  }

  async function handleCreateSubscription(payload, productName) {
    if (!userId) return;

    try {
      const plan = await apiPost(`/users/${userId}/plans`, payload, session.token);
      await invalidateCache([`plans:${userId}`, `orders:${userId}`]);
      await refreshAppData(session, { force: true });
      showSuccess({
        title: "Subscription placed",
        body: `${productName || "Your subscription"} is active now.`,
        onDone: () => {
          setActiveTab("subscriptions");
          setActiveView({ name: "subscriptionDetail", params: { plan } });
        }
      });
    } catch (error) {
      Alert.alert("Unable to create subscription", error.message);
    }
  }

  async function handleSavePlanDays(planId, days) {
    try {
      await apiPost(`/plans/${planId}/days`, { days }, session.token);
      await invalidateCache([`plans:${userId}`]);
      await refreshAppData(session, { force: true });
    } catch (error) {
      Alert.alert("Unable to update subscription", error.message);
    }
  }

  async function handleCancelPlan(planId) {
    try {
      await apiPatch(`/plans/${planId}`, { status: "CANCELLED" }, session.token);
      await invalidateCache([`plans:${userId}`, `orders:${userId}`]);
      await refreshAppData(session, { force: true });
      closeView();
    } catch (error) {
      Alert.alert("Unable to cancel subscription", error.message);
    }
  }

  async function handleSaveAddress(form, options = {}) {
    if (!userId) return null;

    const payload = sanitizeAddress(form);
    if (!payload.title || !payload.line1 || !payload.city || !payload.state || !payload.postalCode) {
      Alert.alert("Incomplete address", "Title, line 1, city, state, and postal code are required.");
      return null;
    }

    try {
      const saved = await apiPost(`/users/${userId}/addresses`, payload, session.token);
      await invalidateCache([`addresses:${userId}`]);
      await refreshAppData(session, { force: true });
      if (options.selectAfterSave) {
        return saved;
      }
      return saved;
    } catch (error) {
      Alert.alert("Unable to save address", error.message);
      return null;
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
  const subscriptions = useMemo(
    () => buildSubscriptionGroups(plans),
    [plans]
  );
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
            onAddAddress: handleSaveAddress,
            onCancelPlan: handleCancelPlan,
            onChangeTab: setActiveTab,
            onCreateSubscription: handleCreateSubscription,
            onLogout: handleLogout,
            onOpenSubscription: (plan) => openView("subscriptionDetail", { plan }),
            onOpenWizard: () => openView("subscriptionWizard"),
            onPlaceOrder: handlePlaceOrder,
            onRefresh: () => refreshAppData(session, { force: true }),
            onSavePlanDays: handleSavePlanDays,
            onShowOrderSubscription: (planId) =>
              setActiveView({
                name: "subscriptionDetail",
                params: { plan: plans.find((item) => item.id === planId) || null }
              }),
            onUpdateCart: updateCartItem,
            orders,
            ordersByPlanId,
            plans,
            products,
            session,
            subscriptions
          })}
        </View>
        {activeView.name === "root" ? (
          <BottomNav activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />
        ) : null}
      </View>
      <SuccessOverlay successState={successState} />
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
      />
    );
  }

  if (activeView.name === "subscriptionDetail") {
    return (
      <SubscriptionDetailScreen
        onCancelPlan={props.onCancelPlan}
        onSavePlanDays={props.onSavePlanDays}
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

function AppHeader({ activeTab, activeView, cartCount, onBack, onOpenCart }) {
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

function ShopScreen({
  appLoading,
  cartCount,
  cartItems,
  onOpenSubscriptions,
  onOpenWizard,
  onUpdateCart,
  products,
  session
}) {
  return (
    <AnimatedScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
        <Card style={styles.heroCard}>
          <Badge>Welcome</Badge>
          <Text style={styles.heroTitle}>{session?.user?.name || session?.user?.phone || "Customer"}</Text>
          <Text style={styles.heroBody}>
            Shop daily dairy products, build a cart, and start subscriptions with the same core flow as the web app.
          </Text>
          <View style={styles.heroActions}>
            <ActionButton onPress={onOpenWizard}>Start Subscription</ActionButton>
            <ActionButton tone="ghost" onPress={onOpenSubscriptions}>
              View Subscriptions
            </ActionButton>
          </View>
          {cartCount ? (
            <Text style={styles.heroCaption}>{cartCount} items are already in your cart.</Text>
          ) : null}
        </Card>

        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionEyebrow}>Products</Text>
            <Text style={styles.sectionTitle}>Browse catalog</Text>
          </View>
          {appLoading ? <ActivityIndicator color={colors.accentStrong} /> : null}
        </View>

        <View style={styles.stack}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              quantity={cartItems.find((item) => item.productId === product.id)?.quantity || 0}
              onUpdateCart={onUpdateCart}
            />
          ))}
        </View>
      </ScrollView>
    </AnimatedScreen>
  );
}

function ProductCard({ product, quantity, onUpdateCart }) {
  return (
    <Card style={styles.productCard}>
      <View style={styles.summaryRow}>
        <View style={styles.flexOne}>
          <Text style={styles.cardTitle}>{product.name}</Text>
          <Text style={styles.cardBody}>{product.description || "Farm-fresh dairy item."}</Text>
        </View>
        <Badge>{product.unit}</Badge>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.priceLabel}>INR {Number(product.price || 0).toFixed(0)}</Text>
        {quantity > 0 ? (
          <View style={styles.inlineStepper}>
            <SmallPillButton label="-" onPress={() => onUpdateCart(product, -1)} />
            <Text style={styles.stepperValue}>{quantity}</Text>
            <SmallPillButton label="+" onPress={() => onUpdateCart(product, 1)} />
          </View>
        ) : (
          <ActionButton onPress={() => onUpdateCart(product, 1)}>Add</ActionButton>
        )}
      </View>
    </Card>
  );
}

function CartScreen({ addresses, cartItems, cartTotal, onAddAddress, onPlaceOrder }) {
  const [addressId, setAddressId] = useState(addresses[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);

  useEffect(() => {
    if (!addressId && addresses[0]?.id) {
      setAddressId(addresses[0].id);
    }
  }, [addressId, addresses]);

  return (
    <AnimatedScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
        <Card>
          <Text style={styles.sectionTitle}>Your cart</Text>
          <View style={styles.stack}>
            {cartItems.length ? (
              cartItems.map((item) => (
                <View key={item.productId} style={styles.listRow}>
                  <View style={styles.flexOne}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardBody}>
                      {item.quantity} x INR {Number(item.price).toFixed(0)} / {item.unit}
                    </Text>
                  </View>
                  <Text style={styles.priceLabel}>
                    INR {(Number(item.quantity) * Number(item.price)).toFixed(0)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.cardBody}>Your cart is empty.</Text>
            )}
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Checkout</Text>
          <Text style={styles.cardBody}>Delivery date</Text>
          <CalendarField label="Delivery date" value={date} onChange={setDate} />
          <Text style={styles.cardBody}>Select address</Text>
          <View style={styles.stack}>
            {addresses.map((address) => (
              <Pressable
                key={address.id}
                style={[styles.selectCard, addressId === address.id && styles.selectCardActive]}
                onPress={() => setAddressId(address.id)}
              >
                <Text style={styles.cardTitle}>{address.title}</Text>
                <Text style={styles.cardBody}>{formatAddress(address)}</Text>
              </Pressable>
            ))}
          </View>
          <ActionButton tone="ghost" onPress={() => setShowAddressModal(true)}>
            Add New Address
          </ActionButton>
          <Text style={styles.cardBody}>Note</Text>
          <Field value={note} onChangeText={setNote} placeholder="Deliver before 7 AM" />
          <View style={styles.summaryBox}>
            <Text style={styles.cardTitle}>Total</Text>
            <Text style={styles.priceLabel}>INR {cartTotal.toFixed(0)}</Text>
          </View>
          <ActionButton
            onPress={() => {
              if (!cartItems.length) {
                Alert.alert("Empty cart", "Add items before placing an order.");
                return;
              }
              if (!addressId) {
                Alert.alert("Select address", "Choose an address before checkout.");
                return;
              }
              onPlaceOrder({ addressId, date, note });
            }}
          >
            Place Order
          </ActionButton>
        </Card>
        <AddressFormModal
          visible={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          onSubmit={async (form) => {
            const saved = await onAddAddress(form, { selectAfterSave: true });
            if (saved?.id) {
              setAddressId(saved.id);
              setShowAddressModal(false);
            }
          }}
        />
      </ScrollView>
    </AnimatedScreen>
  );
}

function SubscriptionsScreen({ groups, onOpenSubscription, onOpenWizard }) {
  const [activeTab, setActiveTab] = useState("active");
  const visible = groups[activeTab] || [];

  return (
    <AnimatedScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
        <Card style={styles.heroCard}>
          <Text style={styles.sectionEyebrow}>Subscriptions</Text>
          <Text style={styles.heroTitle}>Manage every plan from one place</Text>
          <Text style={styles.heroBody}>
            The mobile app now follows the same subscription flow as the web app, including grouped tabs and plan detail views.
          </Text>
          <ActionButton onPress={onOpenWizard}>Start New Subscription</ActionButton>
        </Card>

        <TabRow tabs={subscriptionTabs} activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === "history" ? (
          <View style={styles.stack}>
            {visible.length ? (
              visible.map((group) => (
                <Card key={group.key}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.cardTitle}>{group.label}</Text>
                    <Badge>{group.items.length} delivered</Badge>
                  </View>
                  <View style={styles.stack}>
                    {group.items.map((item) => (
                      <View key={item.id} style={styles.listRow}>
                        <View style={styles.flexOne}>
                          <Text style={styles.cardTitle}>{item.productName}</Text>
                          <Text style={styles.cardBody}>
                            {item.quantity} {item.unit}
                          </Text>
                        </View>
                        <Text style={styles.cardBody}>{item.address || item.planMode}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              ))
            ) : (
              <EmptyCard message="No subscription history yet." />
            )}
          </View>
        ) : (
          <View style={styles.stack}>
            {visible.length ? (
              visible.map((plan) => (
                <Pressable key={plan.id} onPress={() => onOpenSubscription(plan)}>
                  <Card>
                    <View style={styles.summaryRow}>
                      <View style={styles.flexOne}>
                        <Text style={styles.cardTitle}>{plan.product?.name || "Product"}</Text>
                        <Text style={styles.cardBody}>
                          {formatDate(plan.startDate)} to {formatDate(plan.endDate)}
                        </Text>
                      </View>
                      <Badge>{plan.status}</Badge>
                    </View>
                    <Text style={styles.cardBody}>Mode: {plan.mode}</Text>
                  </Card>
                </Pressable>
              ))
            ) : (
              <EmptyCard message={`No ${activeTab} subscriptions.`} />
            )}
          </View>
        )}
      </ScrollView>
    </AnimatedScreen>
  );
}

function SubscriptionDetailScreen({ onCancelPlan, onSavePlanDays, orders, plan }) {
  const [tab, setTab] = useState("today");
  const [draftDays, setDraftDays] = useState(() => normalizePlanDays(plan?.days));

  useEffect(() => {
    setDraftDays(normalizePlanDays(plan?.days));
  }, [plan]);

  const calendar = useMemo(() => {
    if (!plan) return [];
    const start = new Date(plan.startDate);
    const end = new Date(plan.endDate);
    const days = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const key = formatDateKey(cursor);
      const override = draftDays[key];
      const baseQuantity = plan.mode === "CUSTOM" ? 0 : Number(plan.defaultQuantity || 0);
      days.push({
        key,
        date: key,
        quantity: Number(override?.quantity ?? baseQuantity),
        status: override?.status || "PENDING"
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }, [draftDays, plan]);

  const visibleOrders = useMemo(() => filterPlanOrdersByTab(orders, tab), [orders, tab]);

  if (!plan) {
    return <EmptyCard message="Subscription not found." />;
  }

  return (
    <AnimatedScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
        <Card>
          <View style={styles.summaryRow}>
            <View style={styles.flexOne}>
              <Text style={styles.cardTitle}>{plan.product?.name || "Product"}</Text>
              <Text style={styles.cardBody}>
                {formatDate(plan.startDate)} to {formatDate(plan.endDate)}
              </Text>
            </View>
            <Badge>{plan.status}</Badge>
          </View>
          <Text style={styles.cardBody}>Default quantity: {plan.defaultQuantity}</Text>
          <Text style={styles.cardBody}>Mode: {plan.mode}</Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Subscription orders</Text>
          <TabRow tabs={subscriptionOrderTabs} activeTab={tab} onChange={setTab} />
          <View style={styles.stack}>
            {visibleOrders.length ? (
              visibleOrders.map((order) => (
                <Card key={order.id} style={styles.innerCard}>
                  <View style={styles.summaryRow}>
                    <View style={styles.flexOne}>
                      <Text style={styles.cardTitle}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                      <Text style={styles.cardBody}>{formatDate(order.date)}</Text>
                    </View>
                    <Badge>{order.status}</Badge>
                  </View>
                  <Text style={styles.cardBody}>
                    {order.items?.[0]?.quantity || 0} x {order.items?.[0]?.product?.name || plan.product?.name}
                  </Text>
                </Card>
              ))
            ) : (
              <EmptyCard message={`No ${tab} orders for this subscription.`} />
            )}
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Calendar</Text>
          <View style={styles.calendarGrid}>
            {calendar.map((day) => (
              <Pressable
                key={day.key}
                style={[styles.calendarDay, day.quantity === 0 && styles.calendarDayMuted]}
                onPress={() =>
                  setDraftDays((current) => ({
                    ...current,
                    [day.key]: {
                      ...(current[day.key] || {}),
                      quantity: day.quantity === 0 ? Math.max(1, Number(plan.defaultQuantity || 1)) : 0
                    }
                  }))
                }
              >
                <Text style={styles.calendarDate}>{new Date(day.date).getDate()}</Text>
                <Text style={styles.calendarMeta}>{day.quantity === 0 ? "Off" : `Qty ${day.quantity}`}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.heroActions}>
            <ActionButton
              onPress={() =>
                onSavePlanDays(
                  plan.id,
                  Object.entries(draftDays).map(([date, value]) => ({
                    date,
                    quantity: Number(value.quantity || 0)
                  }))
                )
              }
            >
              Save Changes
            </ActionButton>
            <ActionButton tone="ghost" onPress={() => onCancelPlan(plan.id)}>
              Cancel Subscription
            </ActionButton>
          </View>
        </Card>
      </ScrollView>
    </AnimatedScreen>
  );
}

function SubscriptionWizardScreen({ addresses, onAddAddress, onCreateSubscription, products }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    productId: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    quantity: "1",
    mode: "EVERYDAY",
    addressId: addresses[0]?.id || ""
  });
  const [selectedDates, setSelectedDates] = useState({});
  const [showAddressModal, setShowAddressModal] = useState(false);

  useEffect(() => {
    if (!form.addressId && addresses[0]?.id) {
      setForm((current) => ({ ...current, addressId: addresses[0].id }));
    }
  }, [addresses, form.addressId]);

  const selectedProduct = products.find((product) => product.id === form.productId) || null;
  const dateKeys = buildDateKeys(form.startDate, form.endDate);
  const totalDays =
    form.mode === "CUSTOM"
      ? dateKeys.filter((key) => selectedDates[key]).length
      : dateKeys.length;

  return (
    <AnimatedScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
        <Card>
          <Text style={styles.sectionEyebrow}>Start Subscription</Text>
          <Text style={styles.sectionTitle}>Step {step} of 4</Text>
        </Card>

        {step === 1 ? (
          <Card>
            <Text style={styles.sectionTitle}>Select product</Text>
            <View style={styles.stack}>
              {products.map((product) => (
                <Pressable
                  key={product.id}
                  style={[
                    styles.selectCard,
                    form.productId === product.id && styles.selectCardActive
                  ]}
                  onPress={() => setForm((current) => ({ ...current, productId: product.id }))}
                >
                  <Text style={styles.cardTitle}>{product.name}</Text>
                  <Text style={styles.cardBody}>
                    INR {Number(product.price || 0).toFixed(0)} / {product.unit}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>
        ) : null}

        {step === 2 ? (
          <Card>
            <Text style={styles.sectionTitle}>Choose dates and quantity</Text>
            <CalendarField
              label="Start date"
              value={form.startDate}
              onChange={(value) => setForm((current) => ({ ...current, startDate: value }))}
            />
            <CalendarField
              label="End date"
              value={form.endDate}
              onChange={(value) => setForm((current) => ({ ...current, endDate: value }))}
            />
            <Text style={styles.cardBody}>Quantity</Text>
            <Field value={form.quantity} onChangeText={(value) => setForm((current) => ({ ...current, quantity: value }))} />
            <Text style={styles.cardBody}>Mode</Text>
            <View style={styles.heroActions}>
              <ActionButton
                tone={form.mode === "EVERYDAY" ? "primary" : "ghost"}
                onPress={() => setForm((current) => ({ ...current, mode: "EVERYDAY" }))}
              >
                Everyday
              </ActionButton>
              <ActionButton
                tone={form.mode === "CUSTOM" ? "primary" : "ghost"}
                onPress={() => setForm((current) => ({ ...current, mode: "CUSTOM" }))}
              >
                Custom
              </ActionButton>
            </View>
            {form.mode === "CUSTOM" ? (
              <View style={styles.calendarGrid}>
                {dateKeys.map((key) => (
                  <Pressable
                    key={key}
                    style={[styles.calendarDay, !selectedDates[key] && styles.calendarDayMuted]}
                    onPress={() =>
                      setSelectedDates((current) => ({
                        ...current,
                        [key]: !current[key]
                      }))
                    }
                  >
                    <Text style={styles.calendarDate}>{new Date(key).getDate()}</Text>
                    <Text style={styles.calendarMeta}>{selectedDates[key] ? "On" : "Off"}</Text>
                </Pressable>
              ))}
            </View>
            ) : null}
          </Card>
        ) : null}

        {step === 3 ? (
          <Card>
            <Text style={styles.sectionTitle}>Select address</Text>
            <View style={styles.stack}>
              {addresses.map((address) => (
                <Pressable
                  key={address.id}
                  style={[
                    styles.selectCard,
                    form.addressId === address.id && styles.selectCardActive
                  ]}
                  onPress={() => setForm((current) => ({ ...current, addressId: address.id }))}
                >
                  <Text style={styles.cardTitle}>{address.title}</Text>
                  <Text style={styles.cardBody}>{formatAddress(address)}</Text>
                </Pressable>
              ))}
            </View>
            <ActionButton tone="ghost" onPress={() => setShowAddressModal(true)}>
              Add Address
            </ActionButton>
          </Card>
        ) : null}

        {step === 4 ? (
          <Card>
            <Text style={styles.sectionTitle}>Confirm</Text>
            <Text style={styles.cardBody}>Product: {selectedProduct?.name || "-"}</Text>
            <Text style={styles.cardBody}>Dates: {form.startDate} to {form.endDate}</Text>
            <Text style={styles.cardBody}>Days: {totalDays}</Text>
            <Text style={styles.cardBody}>Quantity per day: {form.quantity}</Text>
            <Text style={styles.priceLabel}>
              Estimated total: INR {((selectedProduct?.price || 0) * totalDays * Number(form.quantity || 0)).toFixed(0)}
            </Text>
            <ActionButton
              onPress={() => {
                if (!form.productId || !form.addressId) {
                  Alert.alert("Missing details", "Select product and address first.");
                  return;
                }
                const payload = {
                  productId: form.productId,
                  startDate: form.startDate,
                  endDate: form.endDate,
                  mode: form.mode,
                  addressId: form.addressId,
                  defaultQuantity: Number(form.quantity || 1)
                };

                if (form.mode === "CUSTOM") {
                  const days = dateKeys
                    .filter((key) => selectedDates[key])
                    .map((key) => ({
                      date: key,
                      quantity: Number(form.quantity || 1),
                      addressId: form.addressId
                    }));

                  if (!days.length) {
                    Alert.alert("Select dates", "Choose at least one custom date.");
                    return;
                  }
                  payload.days = days;
                }

                onCreateSubscription(payload, selectedProduct?.name);
              }}
            >
              Cash On Delivery & Place Order
            </ActionButton>
          </Card>
        ) : null}

        <View style={styles.heroActions}>
          <ActionButton tone="ghost" onPress={() => setStep((current) => Math.max(1, current - 1))}>
            Back
          </ActionButton>
          {step < 4 ? (
            <ActionButton onPress={() => setStep((current) => Math.min(4, current + 1))}>
              Next
            </ActionButton>
          ) : null}
        </View>
        <AddressFormModal
          visible={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          onSubmit={async (formValue) => {
            const saved = await onAddAddress(formValue, { selectAfterSave: true });
            if (saved?.id) {
              setForm((current) => ({ ...current, addressId: saved.id }));
              setShowAddressModal(false);
            }
          }}
        />
      </ScrollView>
    </AnimatedScreen>
  );
}

function OrdersScreen({ onOpenSubscription, orders }) {
  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <AnimatedScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
        <Card>
          <Text style={styles.sectionEyebrow}>Orders</Text>
          <Text style={styles.sectionTitle}>Your orders</Text>
        </Card>
        <View style={styles.stack}>
          {orders.length ? (
            orders.map((order) => (
              <Pressable key={order.id} onPress={() => setSelectedOrder(order)}>
                <Card>
                  <View style={styles.summaryRow}>
                    <View style={styles.flexOne}>
                      <Text style={styles.cardTitle}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                      <Text style={styles.cardBody}>{formatDate(order.date)}</Text>
                    </View>
                    <Badge>{order.status}</Badge>
                  </View>
                  <Text style={styles.cardBody}>
                    {order.items?.length || 0} items • INR {computeOrderTotal(order).toFixed(0)}
                  </Text>
                  <Text style={styles.cardBody}>
                    {order.planId ? "Go to subscription" : "Tap to view details"}
                  </Text>
                </Card>
              </Pressable>
            ))
          ) : (
            <EmptyCard message="No orders yet." />
          )}
        </View>
      </ScrollView>
      <Modal animationType="slide" transparent visible={Boolean(selectedOrder)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedOrder ? (
              <>
                <View style={styles.summaryRow}>
                  <View style={styles.flexOne}>
                    <Text style={styles.sectionTitle}>Order #{selectedOrder.id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.cardBody}>{formatDate(selectedOrder.date)}</Text>
                  </View>
                  <Badge>{selectedOrder.status}</Badge>
                </View>
                <View style={styles.stack}>
                  {selectedOrder.items.map((item) => (
                    <View key={item.productId || item.id} style={styles.listRow}>
                      <View style={styles.flexOne}>
                        <Text style={styles.cardTitle}>{item.product?.name || "Product"}</Text>
                        <Text style={styles.cardBody}>{item.quantity} x INR {Number(item.product?.price || 0).toFixed(0)}</Text>
                      </View>
                      <Text style={styles.priceLabel}>
                        INR {(Number(item.quantity || 0) * Number(item.product?.price || 0)).toFixed(0)}
                      </Text>
                    </View>
                  ))}
                </View>
                {selectedOrder.planId ? (
                  <ActionButton
                    onPress={() => {
                      setSelectedOrder(null);
                      onOpenSubscription(selectedOrder.planId);
                    }}
                  >
                    Go to Subscription
                  </ActionButton>
                ) : null}
                <ActionButton tone="ghost" onPress={() => setSelectedOrder(null)}>
                  Close
                </ActionButton>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </AnimatedScreen>
  );
}

function ProfileScreen({ addresses, onAddAddress, onLogout, session }) {
  const [showAddressModal, setShowAddressModal] = useState(false);

  return (
    <AnimatedScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
        <Card style={styles.heroCard}>
          <Text style={styles.sectionEyebrow}>Profile</Text>
          <Text style={styles.heroTitle}>{session?.user?.name || session?.user?.phone || "Customer"}</Text>
          <Text style={styles.heroBody}>{session?.user?.email || session?.user?.phone || "No contact set"}</Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Saved addresses</Text>
          <View style={styles.stack}>
            {addresses.length ? (
              addresses.map((address) => (
                <View key={address.id} style={styles.selectCard}>
                  <Text style={styles.cardTitle}>{address.title}</Text>
                  <Text style={styles.cardBody}>{formatAddress(address)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.cardBody}>No addresses saved yet.</Text>
            )}
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Add address</Text>
          <Text style={styles.cardBody}>Open the address form and save another delivery location.</Text>
          <ActionButton onPress={() => setShowAddressModal(true)}>Add Address</ActionButton>
        </Card>

        <ActionButton tone="ghost" onPress={onLogout}>
          Logout
        </ActionButton>
        <AddressFormModal
          visible={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          onSubmit={async (formValue) => {
            const saved = await onAddAddress(formValue, { selectAfterSave: false });
            if (saved?.id) {
              setShowAddressModal(false);
            }
          }}
        />
      </ScrollView>
    </AnimatedScreen>
  );
}

function AddressFormModal({ visible, onClose, onSubmit }) {
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
            Fill in the delivery details below. Mobile map picking is not configured in this build yet.
          </Text>
          <AddressForm
            form={form}
            onChange={setForm}
            onSubmit={() => onSubmit(form)}
          />
          <ActionButton tone="ghost" onPress={onClose}>
            Close
          </ActionButton>
        </View>
      </View>
    </Modal>
  );
}

function AddressForm({ form, onChange, onSubmit }) {
  return (
    <View style={styles.stack}>
      <Field label="Title" value={form.title} onChangeText={(value) => onChange((current) => ({ ...current, title: value }))} />
      <Field label="House no." value={form.houseNumber} onChangeText={(value) => onChange((current) => ({ ...current, houseNumber: value }))} />
      <Field label="Line 1" value={form.line1} onChangeText={(value) => onChange((current) => ({ ...current, line1: value }))} />
      <Field label="Line 2" value={form.line2} onChangeText={(value) => onChange((current) => ({ ...current, line2: value }))} />
      <Field label="City" value={form.city} onChangeText={(value) => onChange((current) => ({ ...current, city: value }))} />
      <Field label="State" value={form.state} onChangeText={(value) => onChange((current) => ({ ...current, state: value }))} />
      <Field label="Postal code" value={form.postalCode} onChangeText={(value) => onChange((current) => ({ ...current, postalCode: value }))} />
      <ActionButton onPress={onSubmit}>Save Address</ActionButton>
    </View>
  );
}

function TabRow({ tabs, activeTab, onChange }) {
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

function Field({ label, value, onChangeText, placeholder }) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.fieldInput}
      />
    </View>
  );
}

function CalendarField({ label, value, onChange }) {
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
          <ActionButton tone="ghost" onPress={onClose}>
            Close
          </ActionButton>
        </View>
      </View>
    </Modal>
  );
}

function SmallPillButton({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.smallPillButton}>
      <Text style={styles.smallPillLabel}>{label}</Text>
    </Pressable>
  );
}

function EmptyCard({ message }) {
  return (
    <Card>
      <Text style={styles.cardBody}>{message}</Text>
    </Card>
  );
}

function AnimatedScreen({ children }) {
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

function SuccessOverlay({ successState }) {
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

function normalizeProducts(data) {
  const list = Array.isArray(data) ? data : [];
  return list.map((product) => ({
    ...product,
    id: product.id || product._id
  }));
}

function normalizePlanDays(days) {
  if (!days) return {};
  if (Array.isArray(days)) {
    return Object.fromEntries(days.map((day) => [formatDateKey(day.date), day]));
  }
  return days;
}

function buildSubscriptionGroups(plans) {
  const list = Array.isArray(plans) ? plans : [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const active = list.filter((plan) => plan.status === "ACTIVE");
  const cancelled = list.filter((plan) => plan.status === "CANCELLED");
  const completed = list.filter(
    (plan) => plan.status !== "CANCELLED" && new Date(plan.endDate) < today
  );

  const deliveredItems = list.flatMap((plan) =>
    (plan.deliveries || [])
      .filter((delivery) => delivery.status === "DELIVERED")
      .map((delivery) => ({
        id: delivery.id,
        key: formatDateKey(delivery.date),
        label: formatDate(delivery.date),
        productName: delivery.product?.name || plan.product?.name || "Product",
        quantity: delivery.quantity,
        unit: delivery.product?.unit || plan.product?.unit || "L",
        address: delivery.address
          ? `${delivery.address.line1}, ${delivery.address.city}`
          : null,
        planMode: plan.mode
      }))
  );

  const historyMap = deliveredItems.reduce((acc, item) => {
    if (!acc[item.key]) {
      acc[item.key] = {
        key: item.key,
        label: item.label,
        items: []
      };
    }
    acc[item.key].items.push(item);
    return acc;
  }, {});

  const history = Object.values(historyMap).sort((a, b) => new Date(b.key) - new Date(a.key));

  return {
    active,
    cancelled,
    completed,
    history
  };
}

function filterPlanOrdersByTab(orders, tab) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (orders || []).filter((order) => {
    const orderDate = new Date(order.date);
    orderDate.setHours(0, 0, 0, 0);

    if (tab === "today") {
      return orderDate.getTime() === today.getTime() && order.status !== "DELIVERED";
    }
    if (tab === "upcoming") {
      return orderDate.getTime() > today.getTime() && order.status !== "DELIVERED";
    }
    return order.status === "DELIVERED" || orderDate.getTime() < today.getTime();
  });
}

function buildDateKeys(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const keys = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    keys.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
}

function buildCalendarCells(cursor) {
  const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const cells = [];

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const value = new Date(cursor.getFullYear(), cursor.getMonth(), day);
    cells.push({
      day,
      key: formatDateKey(value)
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function computeOrderTotal(order) {
  return (order.items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.product?.price || 0),
    0
  );
}

function sanitizeAddress(form) {
  return {
    title: form.title.trim(),
    houseNumber: form.houseNumber.trim(),
    line1: form.line1.trim(),
    line2: form.line2.trim(),
    landmark: form.landmark.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    postalCode: form.postalCode.trim()
  };
}

function formatAddress(address) {
  return [
    address.houseNumber,
    address.line1,
    address.line2,
    address.landmark,
    address.city,
    address.state,
    address.postalCode
  ]
    .filter(Boolean)
    .join(", ");
}

function formatDate(value) {
  return new Date(value).toLocaleDateString();
}

function formatDateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  shell: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  header: {
    marginBottom: spacing.md
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    alignItems: "center"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted
  },
  backLabel: {
    fontWeight: "800",
    color: colors.ink
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.muted
  },
  headerCart: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...shadows.card
  },
  headerCartLabel: {
    fontWeight: "800",
    color: colors.ink
  },
  status: {
    color: colors.muted,
    marginBottom: spacing.sm
  },
  content: {
    flex: 1
  },
  screenContent: {
    gap: spacing.md,
    paddingBottom: 28
  },
  heroCard: {
    gap: 12,
    backgroundColor: colors.surface
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    color: colors.ink
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted
  },
  heroActions: {
    gap: 10
  },
  heroCaption: {
    color: colors.accentStrong,
    fontWeight: "700"
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sectionEyebrow: {
    textTransform: "uppercase",
    letterSpacing: 1.6,
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink
  },
  stack: {
    gap: 12
  },
  productCard: {
    gap: 12
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    alignItems: "center"
  },
  flexOne: {
    flex: 1
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted
  },
  cardBodyCentered: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink
  },
  inlineStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  stepperValue: {
    minWidth: 24,
    textAlign: "center",
    fontWeight: "800",
    color: colors.ink
  },
  smallPillButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted
  },
  smallPillLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink
  },
  fieldWrap: {
    gap: 6
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: colors.surface
  },
  calendarFieldInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: colors.surface,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  calendarFieldValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  calendarFieldHint: {
    color: colors.accentStrong,
    fontSize: 12,
    fontWeight: "800"
  },
  selectCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 14,
    backgroundColor: colors.card,
    gap: 6
  },
  selectCardActive: {
    borderColor: colors.accentStrong,
    backgroundColor: colors.accentSoft
  },
  inlineGhost: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 10
  },
  inlineGhostLabel: {
    color: colors.ink,
    fontWeight: "800"
  },
  summaryBox: {
    marginTop: 12,
    marginBottom: 12,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted
  },
  tabButtonActive: {
    backgroundColor: colors.accent
  },
  tabLabel: {
    fontWeight: "800",
    color: colors.ink
  },
  tabLabelActive: {
    color: "#FFFFFF"
  },
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  innerCard: {
    backgroundColor: colors.surfaceMuted
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
    marginBottom: 12
  },
  calendarWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 10
  },
  calendarWeekLabel: {
    width: `${100 / 7}%`,
    textAlign: "center",
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  calendarMonthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16
  },
  calendarPickerDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14
  },
  calendarPickerDayActive: {
    backgroundColor: colors.accent
  },
  calendarPickerDayLabel: {
    color: colors.ink,
    fontWeight: "700"
  },
  calendarPickerDayLabelActive: {
    color: "#FFFFFF"
  },
  calendarPickerEmpty: {
    width: `${100 / 7}%`,
    aspectRatio: 1
  },
  calendarDay: {
    width: "22%",
    minWidth: 68,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 4
  },
  calendarDayMuted: {
    opacity: 0.55
  },
  calendarDate: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink
  },
  calendarMeta: {
    fontSize: 12,
    color: colors.muted
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(33,22,15,0.3)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 20,
    gap: 14
  },
  successCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 24,
    gap: 10,
    alignItems: "center",
    ...shadows.card
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  successCheck: {
    fontSize: 34,
    fontWeight: "900",
    color: colors.success
  }
});
