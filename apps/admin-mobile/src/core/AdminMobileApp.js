import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { apiGet, apiGetCached, apiPatch, apiPost, invalidateCache } from "../services/api";
import { clearSession, loadSession, saveSession } from "../services/cache";

const ADMIN_TABS = [
  { key: "overview", label: "Overview" },
  { key: "subscriptions", label: "Plans" },
  { key: "deliveries", label: "Orders" },
  { key: "products", label: "Products" },
  { key: "customers", label: "Customers" },
  { key: "users", label: "Users" },
  { key: "billing", label: "Billing" },
  { key: "reports", label: "Reports" }
];

const DELIVERY_TABS = [
  { key: "delivery", label: "Today" },
  { key: "delivery-history", label: "Done" }
];

const PRODUCT_FORM = {
  name: "",
  description: "",
  unit: "L",
  price: "",
  imageUrl: ""
};

const USER_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "DELIVERY"
};

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function formatDateLong(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatCurrency(value) {
  return `INR ${Number(value || 0).toFixed(2)}`;
}

function formatAddress(address) {
  if (!address) return "-";
  return [address.houseNumber, address.line1, address.line2, address.city, address.postalCode]
    .filter(Boolean)
    .join(", ");
}

function getTabsForRole(role) {
  return role === "DELIVERY" ? DELIVERY_TABS : ADMIN_TABS;
}

function getInitialRoute(role) {
  return role === "DELIVERY"
    ? { screen: "delivery", params: {} }
    : { screen: "overview", params: {} };
}

export default function AdminMobileApp() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);
  const [route, setRoute] = useState({ screen: "overview", params: {} });
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState("");
  const [flash, setFlash] = useState(null);
  const [data, setData] = useState({
    overviewDeliveries: [],
    activePlans: [],
    subscriptions: [],
    todayOrders: [],
    upcomingOrders: [],
    completedOrders: [],
    products: [],
    customers: [],
    customerDetail: null,
    billingInvoices: [],
    reports: null,
    users: [],
    subscriptionDetail: null,
    deliveryToday: [],
    deliveryCompleted: []
  });
  const [filters, setFilters] = useState(() => {
    const now = new Date();
    return {
      billingMonth: String(now.getMonth() + 1),
      billingYear: String(now.getFullYear())
    };
  });
  const [forms, setForms] = useState({
    login: { username: "", password: "" },
    product: PRODUCT_FORM,
    editingProductId: null,
    productEdit: PRODUCT_FORM,
    user: USER_FORM
  });
  const [busy, setBusy] = useState({
    auth: false,
    routeSheet: false,
    invoiceGeneration: false,
    productCreate: false,
    productSave: false,
    userCreate: false
  });

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    if (!flash) return undefined;
    const timeout = setTimeout(() => setFlash(null), 2800);
    return () => clearTimeout(timeout);
  }, [flash]);

  async function bootstrap() {
    const stored = await loadSession();
    if (stored?.token && ["ADMIN", "DELIVERY"].includes(stored.user?.role)) {
      setSession(stored);
      setRoute(getInitialRoute(stored.user.role));
      await loadData(stored, getInitialRoute(stored.user.role).screen, { force: false });
    }
    setBooting(false);
  }

  function showFlash(message, type = "info") {
    if (!message) return;
    setFlash({ message, type });
  }

  function updateData(patch) {
    setData((current) => ({ ...current, ...patch }));
  }

  async function loadData(
    sessionOverride = session,
    screen = route.screen,
    options = {},
    paramsOverride = route.params
  ) {
    if (!sessionOverride?.token) return;

    const token = sessionOverride.token;
    const role = sessionOverride.user?.role;
    const force = Boolean(options.force);

    setRefreshing(true);
    setStatus("");

    try {
      if (role === "DELIVERY") {
        const [today, delivered] = await Promise.all([
          apiGetCached("/deliveries/mine/today", token, {
            key: "delivery:today",
            maxAgeMs: 30_000,
            force
          }),
          apiGetCached("/deliveries/mine/delivered", token, {
            key: "delivery:delivered",
            maxAgeMs: 30_000,
            force
          })
        ]);

        updateData({
          deliveryToday: Array.isArray(today) ? today : [],
          deliveryCompleted: Array.isArray(delivered) ? delivered : []
        });
        return;
      }

      if (screen === "overview") {
        const [deliveries, activePlans] = await Promise.all([
          apiGetCached("/admin/deliveries/daily", token, {
            key: "admin:overview:deliveries",
            maxAgeMs: 30_000,
            force
          }),
          apiGetCached("/admin/subscriptions/summary", token, {
            key: "admin:overview:plans",
            maxAgeMs: 30_000,
            force
          })
        ]);
        updateData({
          overviewDeliveries: Array.isArray(deliveries)
            ? deliveries.filter((item) => item.status !== "CANCELLED")
            : [],
          activePlans: Array.isArray(activePlans) ? activePlans : []
        });
      }

      if (screen === "subscriptions") {
        const list = await apiGetCached("/admin/subscriptions", token, {
          key: "admin:subscriptions",
          maxAgeMs: 30_000,
          force
        });
        updateData({
          subscriptions: (Array.isArray(list) ? list : []).filter(
            (plan) => plan.status !== "CANCELLED"
          )
        });
      }

      if (screen === "deliveries") {
        const [today, upcoming, completed] = await Promise.all([
          apiGetCached("/admin/orders?scope=today", token, {
            key: "admin:orders:today",
            maxAgeMs: 30_000,
            force
          }),
          apiGetCached("/admin/orders?scope=upcoming", token, {
            key: "admin:orders:upcoming",
            maxAgeMs: 30_000,
            force
          }),
          apiGetCached("/admin/orders?scope=completed", token, {
            key: "admin:orders:completed",
            maxAgeMs: 30_000,
            force
          })
        ]);
        updateData({
          todayOrders: Array.isArray(today) ? today : [],
          upcomingOrders: Array.isArray(upcoming) ? upcoming : [],
          completedOrders: Array.isArray(completed) ? completed : []
        });
      }

      if (screen === "products") {
        const products = await apiGetCached("/products?includeInactive=true", token, {
          key: "admin:products",
          maxAgeMs: 30_000,
          force
        });
        updateData({ products: Array.isArray(products) ? products : [] });
      }

      if (screen === "customers") {
        const customers = await apiGetCached("/admin/customers", token, {
          key: "admin:customers",
          maxAgeMs: 30_000,
          force
        });
        updateData({ customers: Array.isArray(customers) ? customers : [] });
      }

      if (screen === "users") {
        const users = await apiGetCached("/admin/users", token, {
          key: "admin:users",
          maxAgeMs: 30_000,
          force
        });
        updateData({ users: Array.isArray(users) ? users : [] });
      }

      if (screen === "billing") {
        const invoices = await apiGetCached(
          `/admin/invoices?month=${filters.billingMonth}&year=${filters.billingYear}`,
          token,
          {
            key: `admin:billing:${filters.billingMonth}:${filters.billingYear}`,
            maxAgeMs: 30_000,
            force
          }
        );
        updateData({ billingInvoices: Array.isArray(invoices) ? invoices : [] });
      }

      if (screen === "reports") {
        const reports = await apiGetCached("/admin/reports/summary", token, {
          key: "admin:reports",
          maxAgeMs: 30_000,
          force
        });
        updateData({ reports });
      }

      if (screen === "subscription-detail" && paramsOverride?.planId) {
        const detail = await apiGet(`/admin/subscriptions/${paramsOverride.planId}`, token);
        updateData({ subscriptionDetail: detail });
      }

      if (screen === "customer-detail" && paramsOverride?.customerId) {
        const detail = await apiGet(`/admin/customers/${paramsOverride.customerId}`, token);
        updateData({ customerDetail: detail });
      }
    } catch (error) {
      setStatus(error.message || "Unable to load data.");
      showFlash(error.message || "Unable to load data.", "error");
    } finally {
      setRefreshing(false);
    }
  }

  async function refreshCurrent(force = true) {
    await loadData(session, route.screen, { force }, route.params);
  }

  async function handleLogin() {
    const username = forms.login.username.trim();
    const password = forms.login.password.trim();

    if (!username || !password) {
      setStatus("Enter username and password.");
      return;
    }

    setBusy((current) => ({ ...current, auth: true }));
    setStatus("");
    try {
      const payload = await apiPost("/auth/staff-login", { username, password });
      if (!["ADMIN", "DELIVERY"].includes(payload.user?.role)) {
        throw new Error("Only admin and delivery users can sign in here.");
      }
      await saveSession(payload);
      setSession(payload);
      setRoute(getInitialRoute(payload.user.role));
      setForms((current) => ({ ...current, login: { username: "", password: "" } }));
      await loadData(
        payload,
        getInitialRoute(payload.user.role).screen,
        { force: true },
        getInitialRoute(payload.user.role).params
      );
      showFlash("Logged in successfully.", "success");
    } catch (error) {
      setStatus(error.message || "Unable to sign in.");
      showFlash(error.message || "Unable to sign in.", "error");
    } finally {
      setBusy((current) => ({ ...current, auth: false }));
    }
  }

  async function handleLogout() {
    await clearSession();
    setSession(null);
    setRoute({ screen: "overview", params: {} });
    setStatus("");
    setData({
      overviewDeliveries: [],
      activePlans: [],
      subscriptions: [],
      todayOrders: [],
      upcomingOrders: [],
      completedOrders: [],
      products: [],
      customers: [],
      customerDetail: null,
      billingInvoices: [],
      reports: null,
      users: [],
      subscriptionDetail: null,
      deliveryToday: [],
      deliveryCompleted: []
    });
  }

  async function navigateTo(screen, params = {}) {
    const nextRoute = { screen, params };
    setRoute(nextRoute);
    await loadData(session, screen, { force: false }, params);
  }

  async function generateRouteSheet() {
    setBusy((current) => ({ ...current, routeSheet: true }));
    try {
      const res = await apiPost("/admin/deliveries/generate", {}, session.token);
      await invalidateCache(["admin:overview:deliveries"]);
      await refreshCurrent(true);
      showFlash(`Route sheet generated. ${res.created || 0} deliveries prepared.`, "success");
    } catch (error) {
      showFlash(error.message || "Unable to generate route sheet.", "error");
    } finally {
      setBusy((current) => ({ ...current, routeSheet: false }));
    }
  }

  async function updateOrderStatus(orderId, nextStatus) {
    try {
      await apiPatch(`/admin/orders/${orderId}`, { status: nextStatus }, session.token);
      await invalidateCache([
        "admin:orders:today",
        "admin:orders:upcoming",
        "admin:orders:completed"
      ]);
      await refreshCurrent(true);
      showFlash(
        nextStatus === "COMPLETED" ? "Order marked delivered." : "Order cancelled.",
        "success"
      );
    } catch (error) {
      showFlash(error.message || "Unable to update order.", "error");
    }
  }

  async function updateDeliveryStatus(deliveryId) {
    try {
      await apiPatch(`/deliveries/${deliveryId}`, { status: "DELIVERED" }, session.token);
      await invalidateCache(["delivery:today", "delivery:delivered"]);
      await refreshCurrent(true);
      showFlash("Delivery marked as delivered.", "success");
    } catch (error) {
      showFlash(error.message || "Unable to update delivery.", "error");
    }
  }

  async function createProduct() {
    const product = forms.product;
    const price = Number(product.price);
    if (!product.name.trim()) {
      showFlash("Product name is required.", "error");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      showFlash("Enter a valid price.", "error");
      return;
    }

    setBusy((current) => ({ ...current, productCreate: true }));
    try {
      await apiPost(
        "/products",
        {
          name: product.name.trim(),
          description: product.description.trim(),
          unit: product.unit.trim() || "L",
          price,
          imageUrl: product.imageUrl.trim() || undefined
        },
        session.token
      );
      setForms((current) => ({ ...current, product: PRODUCT_FORM }));
      await invalidateCache(["admin:products"]);
      await refreshCurrent(true);
      showFlash("Product saved.", "success");
    } catch (error) {
      showFlash(error.message || "Unable to save product.", "error");
    } finally {
      setBusy((current) => ({ ...current, productCreate: false }));
    }
  }

  function startEditProduct(product) {
    setForms((current) => ({
      ...current,
      editingProductId: product._id,
      productEdit: {
        name: product.name || "",
        description: product.description || "",
        unit: product.unit || "L",
        price: String(product.price || ""),
        imageUrl: product.imageUrl || "",
        isActive: Boolean(product.isActive)
      }
    }));
  }

  async function saveProductEdit(productId) {
    const product = forms.productEdit;
    const price = Number(product.price);
    if (!product.name.trim()) {
      showFlash("Product name is required.", "error");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      showFlash("Enter a valid price.", "error");
      return;
    }

    setBusy((current) => ({ ...current, productSave: true }));
    try {
      await apiPatch(
        `/products/${productId}`,
        {
          name: product.name.trim(),
          description: product.description.trim(),
          unit: product.unit.trim() || "L",
          price,
          imageUrl: product.imageUrl.trim() || undefined,
          isActive: Boolean(product.isActive)
        },
        session.token
      );
      setForms((current) => ({ ...current, editingProductId: null, productEdit: PRODUCT_FORM }));
      await invalidateCache(["admin:products"]);
      await refreshCurrent(true);
      showFlash("Product updated.", "success");
    } catch (error) {
      showFlash(error.message || "Unable to update product.", "error");
    } finally {
      setBusy((current) => ({ ...current, productSave: false }));
    }
  }

  async function createUser() {
    const user = forms.user;
    if (!user.name.trim() || !user.email.trim() || !user.phone.trim() || !user.password.trim()) {
      showFlash("Name, email, phone number, and password are required.", "error");
      return;
    }

    setBusy((current) => ({ ...current, userCreate: true }));
    try {
      const created = await apiPost(
        "/admin/users",
        {
          name: user.name.trim(),
          email: user.email.trim(),
          phone: user.phone.trim(),
          password: user.password.trim(),
          role: user.role
        },
        session.token
      );
      setForms((current) => ({ ...current, user: USER_FORM }));
      await invalidateCache(["admin:users"]);
      await refreshCurrent(true);
      showFlash(`User created. Username: ${created.username}`, "success");
    } catch (error) {
      showFlash(error.message || "Unable to create user.", "error");
    } finally {
      setBusy((current) => ({ ...current, userCreate: false }));
    }
  }

  async function loadBilling() {
    await loadData(session, "billing", { force: true });
  }

  async function generateInvoices() {
    setBusy((current) => ({ ...current, invoiceGeneration: true }));
    try {
      const result = await apiPost(
        `/admin/invoices/generate?month=${filters.billingMonth}&year=${filters.billingYear}`,
        {},
        session.token
      );
      await invalidateCache([`admin:billing:${filters.billingMonth}:${filters.billingYear}`]);
      await loadBilling();
      showFlash(`Invoices generated. ${result.created || 0} records updated.`, "success");
    } catch (error) {
      showFlash(error.message || "Unable to generate invoices.", "error");
    } finally {
      setBusy((current) => ({ ...current, invoiceGeneration: false }));
    }
  }

  const totalLiters = useMemo(
    () => data.overviewDeliveries.reduce((sum, item) => sum + (item.totalQuantity || 0), 0),
    [data.overviewDeliveries]
  );

  const totalCustomers = useMemo(
    () => new Set(data.overviewDeliveries.map((item) => item.customer?.id).filter(Boolean)).size,
    [data.overviewDeliveries]
  );

  if (booting) {
    return (
      <SafeAreaView style={styles.bootShell}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#1F5E46" />
        <Text style={styles.bootText}>Loading admin app...</Text>
      </SafeAreaView>
    );
  }

  if (!session?.user) {
    return (
      <SafeAreaView style={styles.authShell}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.authContent}>
          <Text style={styles.eyebrow}>Secure Access</Text>
          <Text style={styles.authTitle}>Admin Mobile Login</Text>
          <Text style={styles.authSubtitle}>
            Use the same admin or delivery credentials as the admin website.
          </Text>

          <Card>
            <Field
              label="Username"
              value={forms.login.username}
              placeholder="admin"
              onChangeText={(value) =>
                setForms((current) => ({
                  ...current,
                  login: { ...current.login, username: value }
                }))
              }
            />
            <Field
              label="Password"
              value={forms.login.password}
              secureTextEntry
              placeholder="Enter password"
              onChangeText={(value) =>
                setForms((current) => ({
                  ...current,
                  login: { ...current.login, password: value }
                }))
              }
            />
            <PrimaryButton
              label={busy.auth ? "Logging in..." : "Login"}
              onPress={handleLogin}
              disabled={busy.auth}
            />
            <Text style={styles.hint}>Demo: `admin / admin123` and `delivery / delivery123`.</Text>
            {status ? <InlineMessage type="error" message={status} /> : null}
          </Card>
        </ScrollView>
        <FlashBanner flash={flash} />
      </SafeAreaView>
    );
  }

  const role = session.user.role;
  const tabs = getTabsForRole(role);
  const currentScreen = route.screen;

  return (
    <SafeAreaView style={styles.appShell}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Mazara {role === "DELIVERY" ? "Delivery" : "Admin"}</Text>
          <Text style={styles.headerSubtitle}>
            {session.user.name || session.user.username || "User"} • {role}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <GhostButton label="Refresh" onPress={() => refreshCurrent(true)} />
          <GhostButton label="Logout" onPress={handleLogout} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {refreshing ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#1F5E46" />
            <Text style={styles.loadingText}>Refreshing data...</Text>
          </View>
        ) : null}

        {role === "ADMIN" && currentScreen === "overview" ? (
          <>
            <SectionTitle
              title="Daily Overview"
              subtitle="Everything your team needs for today's delivery run."
            />
            <View style={styles.metricGrid}>
              <MetricCard label="Customers" value={String(totalCustomers)} />
              <MetricCard label="Today's Litres" value={`${totalLiters} L`} />
              <MetricCard label="Pending Deliveries" value={String(data.overviewDeliveries.length)} />
              <MetricCard label="Active Plans" value={String(data.activePlans.length)} />
            </View>
            <PrimaryButton
              label={busy.routeSheet ? "Generating..." : "Generate Route Sheet"}
              onPress={generateRouteSheet}
              disabled={busy.routeSheet}
            />
            <ListCard
              title="Active Subscriptions"
              items={data.activePlans}
              emptyMessage="No active subscriptions."
              renderItem={(plan) => (
                <ListRow
                  key={plan.id}
                  title={`${plan.user?.name || plan.user?.phone || "Customer"} • ${
                    plan.product?.name || "Product"
                  }`}
                  subtitle={`${plan.mode} • ${plan.defaultQuantity} ${plan.product?.unit || ""}`}
                  meta={plan.status}
                />
              )}
            />
            <ListCard
              title="Delivery Sheet"
              items={data.overviewDeliveries}
              emptyMessage="No deliveries for today."
              renderItem={(item) => (
                <ListRow
                  key={item.id}
                  title={item.customer?.name || "Customer"}
                  subtitle={`${formatAddress(item.address)} • Qty ${item.totalQuantity || 0}`}
                  meta={item.status || "Pending"}
                />
              )}
            />
          </>
        ) : null}

        {role === "ADMIN" && currentScreen === "subscriptions" ? (
          <>
            <SectionTitle title="Subscriptions" subtitle="All active and historical plan records." />
            <ListCard
              items={data.subscriptions}
              emptyMessage="No subscriptions found."
              renderItem={(plan) => (
                <Pressable
                  key={plan.id}
                  onPress={() => navigateTo("subscription-detail", { planId: plan.id })}
                >
                  <ListRow
                    title={`${plan.user?.name || "Customer"} • ${plan.product?.name || "Product"}`}
                    subtitle={`${formatDate(plan.startDate)} to ${formatDate(
                      plan.endDate
                    )} • ${plan.defaultQuantity} ${plan.product?.unit || ""}`}
                    meta={plan.status}
                  />
                </Pressable>
              )}
            />
          </>
        ) : null}

        {role === "ADMIN" && currentScreen === "subscription-detail" ? (
          <SubscriptionDetailScreen
            detail={data.subscriptionDetail}
            onBack={() => navigateTo("subscriptions")}
            onOpenCustomer={(customerId) => navigateTo("customer-detail", { customerId })}
          />
        ) : null}

        {role === "ADMIN" && currentScreen === "deliveries" ? (
          <OrdersScreen
            todayOrders={data.todayOrders}
            upcomingOrders={data.upcomingOrders}
            completedOrders={data.completedOrders}
            onMarkDelivered={(orderId) => {
              Alert.alert("Mark delivered", "Mark this order as completed?", [
                { text: "Cancel", style: "cancel" },
                { text: "Confirm", onPress: () => updateOrderStatus(orderId, "COMPLETED") }
              ]);
            }}
            onCancelOrder={(orderId) => {
              Alert.alert("Cancel order", "Cancel this order?", [
                { text: "No", style: "cancel" },
                { text: "Yes", style: "destructive", onPress: () => updateOrderStatus(orderId, "CANCELLED") }
              ]);
            }}
          />
        ) : null}

        {role === "ADMIN" && currentScreen === "products" ? (
          <>
            <SectionTitle title="Products" subtitle="Create, update, price, and disable products." />
            <Card>
              <Field
                label="Name"
                value={forms.product.name}
                onChangeText={(value) =>
                  setForms((current) => ({
                    ...current,
                    product: { ...current.product, name: value }
                  }))
                }
              />
              <Field
                label="Description"
                value={forms.product.description}
                onChangeText={(value) =>
                  setForms((current) => ({
                    ...current,
                    product: { ...current.product, description: value }
                  }))
                }
              />
              <View style={styles.row}>
                <View style={styles.rowCell}>
                  <Field
                    label="Unit"
                    value={forms.product.unit}
                    onChangeText={(value) =>
                      setForms((current) => ({
                        ...current,
                        product: { ...current.product, unit: value }
                      }))
                    }
                  />
                </View>
                <View style={styles.rowCell}>
                  <Field
                    label="Price"
                    value={forms.product.price}
                    keyboardType="numeric"
                    onChangeText={(value) =>
                      setForms((current) => ({
                        ...current,
                        product: { ...current.product, price: value }
                      }))
                    }
                  />
                </View>
              </View>
              <Field
                label="Image URL"
                value={forms.product.imageUrl}
                onChangeText={(value) =>
                  setForms((current) => ({
                    ...current,
                    product: { ...current.product, imageUrl: value }
                  }))
                }
              />
              <PrimaryButton
                label={busy.productCreate ? "Saving..." : "Add Product"}
                onPress={createProduct}
                disabled={busy.productCreate}
              />
            </Card>

            <ListCard
              title="Product List"
              items={data.products}
              emptyMessage="No products yet."
              renderItem={(product) => (
                <Card key={product._id}>
                  <ListRow
                    title={product.name}
                    subtitle={`${product.description || "-"} • ${product.unit}`}
                    meta={`${formatCurrency(product.price)} • ${
                      product.isActive ? "Active" : "Inactive"
                    }`}
                  />
                  <GhostButton label="Edit" onPress={() => startEditProduct(product)} />
                </Card>
              )}
            />
          </>
        ) : null}

        {role === "ADMIN" && currentScreen === "customers" ? (
          <>
            <SectionTitle title="Customers" subtitle="Open a customer to inspect plans and orders." />
            <ListCard
              items={data.customers}
              emptyMessage="No customers found."
              renderItem={(customer) => (
                <Pressable
                  key={customer.id}
                  onPress={() => navigateTo("customer-detail", { customerId: customer.id })}
                >
                  <ListRow
                    title={customer.name || "Customer"}
                    subtitle={`${customer.phone || "-"} • ${customer.email || "-"}`}
                    meta={`${customer.activePlans || 0} active • ${customer.totalOrders || 0} orders`}
                  />
                </Pressable>
              )}
            />
          </>
        ) : null}

        {role === "ADMIN" && currentScreen === "customer-detail" ? (
          <CustomerDetailScreen
            detail={data.customerDetail}
            onBack={() => navigateTo("customers")}
            onOpenPlan={(planId) => navigateTo("subscription-detail", { planId })}
          />
        ) : null}

        {role === "ADMIN" && currentScreen === "users" ? (
          <>
            <SectionTitle title="Users" subtitle="Create admin and delivery accounts." />
            <Card>
              <Field
                label="Name"
                value={forms.user.name}
                onChangeText={(value) =>
                  setForms((current) => ({ ...current, user: { ...current.user, name: value } }))
                }
              />
              <Field
                label="Email"
                value={forms.user.email}
                keyboardType="email-address"
                onChangeText={(value) =>
                  setForms((current) => ({ ...current, user: { ...current.user, email: value } }))
                }
              />
              <Field
                label="Phone"
                value={forms.user.phone}
                keyboardType="phone-pad"
                onChangeText={(value) =>
                  setForms((current) => ({ ...current, user: { ...current.user, phone: value } }))
                }
              />
              <Field
                label="Password"
                value={forms.user.password}
                secureTextEntry
                onChangeText={(value) =>
                  setForms((current) => ({
                    ...current,
                    user: { ...current.user, password: value }
                  }))
                }
              />
              <SegmentedControl
                label="Role"
                options={["DELIVERY", "ADMIN"]}
                value={forms.user.role}
                onChange={(value) =>
                  setForms((current) => ({ ...current, user: { ...current.user, role: value } }))
                }
              />
              <PrimaryButton
                label={busy.userCreate ? "Creating..." : "Add User"}
                onPress={createUser}
                disabled={busy.userCreate}
              />
            </Card>
            <ListCard
              title="Active Users"
              items={data.users}
              emptyMessage="No admin or delivery users found."
              renderItem={(user) => (
                <ListRow
                  key={user.id}
                  title={user.name || "-"}
                  subtitle={`${user.username || "-"} • ${user.email || "-"}`}
                  meta={`${user.phone || "-"} • ${user.role}`}
                />
              )}
            />
          </>
        ) : null}

        {role === "ADMIN" && currentScreen === "billing" ? (
          <>
            <SectionTitle title="Billing" subtitle="Generate and review monthly invoices." />
            <Card>
              <View style={styles.row}>
                <View style={styles.rowCell}>
                  <Field
                    label="Month"
                    value={filters.billingMonth}
                    keyboardType="numeric"
                    onChangeText={(value) =>
                      setFilters((current) => ({ ...current, billingMonth: value }))
                    }
                  />
                </View>
                <View style={styles.rowCell}>
                  <Field
                    label="Year"
                    value={filters.billingYear}
                    keyboardType="numeric"
                    onChangeText={(value) =>
                      setFilters((current) => ({ ...current, billingYear: value }))
                    }
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.rowCell}>
                  <PrimaryButton label="Load Billing" onPress={loadBilling} />
                </View>
                <View style={styles.rowCell}>
                  <PrimaryButton
                    label={busy.invoiceGeneration ? "Generating..." : "Generate Invoices"}
                    onPress={generateInvoices}
                    disabled={busy.invoiceGeneration}
                  />
                </View>
              </View>
            </Card>
            <ListCard
              items={data.billingInvoices}
              emptyMessage="No invoices for this month yet."
              renderItem={(invoice) => (
                <ListRow
                  key={invoice.id}
                  title={invoice.user?.name || invoice.user?.phone || "Customer"}
                  subtitle={`${invoice.month}/${invoice.year} • ${invoice.status}`}
                  meta={`${formatCurrency(invoice.totalAmount)} • ${
                    invoice.payments?.length || 0
                  } payments`}
                />
              )}
            />
          </>
        ) : null}

        {role === "ADMIN" && currentScreen === "reports" ? (
          <>
            <SectionTitle title="Reports" subtitle="Current summary metrics from admin reporting." />
            <View style={styles.metricGrid}>
              <MetricCard
                label="Daily Litres"
                value={`${data.reports?.dailyLitres || 0} L`}
              />
              <MetricCard
                label="Active Subscribers"
                value={String(data.reports?.activeSubscribers || 0)}
              />
              <MetricCard label="Retention" value={`${data.reports?.retention || 0}%`} />
              <MetricCard
                label="Paid Revenue"
                value={formatCurrency(data.reports?.paidRevenue || 0)}
              />
            </View>
            <Card>
              <Text style={styles.bodyText}>
                Delivered: {data.reports?.deliveredCount || 0} • Pending:{" "}
                {data.reports?.pendingCount || 0}
              </Text>
            </Card>
          </>
        ) : null}

        {role === "DELIVERY" && (currentScreen === "delivery" || currentScreen === "delivery-history") ? (
          <>
            <SectionTitle
              title={currentScreen === "delivery" ? "Today's Deliveries" : "Delivered Orders"}
              subtitle="Route, payment collection, and completion tracking."
            />
            <ListCard
              items={currentScreen === "delivery" ? data.deliveryToday : data.deliveryCompleted}
              emptyMessage={
                currentScreen === "delivery"
                  ? "No deliveries assigned for today."
                  : "No delivered orders yet."
              }
              renderItem={(delivery) => (
                <Card key={delivery.id}>
                  <ListRow
                    title={delivery.customer?.name || "Customer"}
                    subtitle={`${delivery.customer?.phone || "-"} • ${formatAddress(
                      delivery.address
                    )}`}
                    meta={`${delivery.product?.name || "Product"} • ${delivery.quantity} ${
                      delivery.product?.unit || ""
                    }`}
                  />
                  <Text style={styles.secondaryMeta}>
                    {formatCurrency(delivery.amountToCollect)} • {delivery.status}
                  </Text>
                  {currentScreen === "delivery" ? (
                    <PrimaryButton
                      label="Mark Delivered"
                      onPress={() => updateDeliveryStatus(delivery.id)}
                    />
                  ) : null}
                </Card>
              )}
            />
          </>
        ) : null}

        {status ? <InlineMessage type="error" message={status} /> : null}
      </ScrollView>

      {tabs.some((item) => item.key === route.screen) ? null : (
        <View style={styles.backBar}>
          <GhostButton
            label="Back"
            onPress={() => navigateTo(role === "DELIVERY" ? "delivery" : "overview")}
          />
        </View>
      )}

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tabItem, route.screen === tab.key ? styles.tabItemActive : null]}
            onPress={() => navigateTo(tab.key)}
          >
            <Text style={[styles.tabLabel, route.screen === tab.key ? styles.tabLabelActive : null]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ProductEditModal
        visible={Boolean(forms.editingProductId)}
        form={forms.productEdit}
        saving={busy.productSave}
        onClose={() =>
          setForms((current) => ({ ...current, editingProductId: null, productEdit: PRODUCT_FORM }))
        }
        onChange={(patch) =>
          setForms((current) => ({
            ...current,
            productEdit: { ...current.productEdit, ...patch }
          }))
        }
        onSave={() => saveProductEdit(forms.editingProductId)}
      />

      <FlashBanner flash={flash} />
    </SafeAreaView>
  );
}

function OrdersScreen({ todayOrders, upcomingOrders, completedOrders, onMarkDelivered, onCancelOrder }) {
  const [activeTab, setActiveTab] = useState("today");
  const list =
    activeTab === "today" ? todayOrders : activeTab === "upcoming" ? upcomingOrders : completedOrders;

  return (
    <>
      <SectionTitle title="Orders" subtitle="Today's, upcoming, and completed admin orders." />
      <SegmentedControl
        options={["today", "upcoming", "completed"]}
        value={activeTab}
        onChange={setActiveTab}
      />
      <ListCard
        items={list}
        emptyMessage="No orders available."
        renderItem={(order) => (
          <Card key={order.id}>
            <ListRow
              title={`${order.customer?.name || "Customer"} • ${formatDateLong(order.date)}`}
              subtitle={`${formatAddress(order.address)} • ${order.itemCount || 0} items`}
              meta={`${formatCurrency(order.totalAmount)} • ${order.status}`}
            />
            <Text style={styles.bodyText}>
              {(order.items || [])
                .map((item) => `${item.name} (${item.quantity} ${item.unit || ""})`)
                .join(", ") || "No items"}
            </Text>
            {activeTab !== "completed" ? (
              <View style={styles.row}>
                <View style={styles.rowCell}>
                  <PrimaryButton label="Mark Delivered" onPress={() => onMarkDelivered(order.id)} />
                </View>
                <View style={styles.rowCell}>
                  <GhostButton label="Cancel Order" onPress={() => onCancelOrder(order.id)} />
                </View>
              </View>
            ) : null}
          </Card>
        )}
      />
    </>
  );
}

function SubscriptionDetailScreen({ detail, onBack, onOpenCustomer }) {
  const plan = detail?.plan;
  const customer = detail?.customer;
  const orders = detail?.orders || [];

  return (
    <>
      <GhostButton label="Back to Subscriptions" onPress={onBack} />
      <SectionTitle
        title={plan?.product?.name || "Subscription"}
        subtitle={`${customer?.name || "Customer"} • ${customer?.phone || "-"}`}
      />
      {!detail ? <InlineMessage message="Unable to load subscription details." type="error" /> : null}
      {detail ? (
        <>
          <View style={styles.metricGrid}>
            <MetricCard label="Start" value={formatDate(plan?.startDate)} />
            <MetricCard label="End" value={formatDate(plan?.endDate)} />
            <MetricCard
              label="Quantity"
              value={`${plan?.defaultQuantity || 0} ${plan?.product?.unit || ""}`}
            />
            <MetricCard label="Status" value={plan?.status || "-"} />
          </View>
          <Card>
            <Text style={styles.cardTitle}>Summary</Text>
            <Text style={styles.bodyText}>Mode: {plan?.mode || "-"}</Text>
            <Text style={styles.bodyText}>Price: {formatCurrency(plan?.product?.price)}</Text>
            <Text style={styles.bodyText}>
              Progress: {plan?.completedDeliveries || 0} / {plan?.totalDeliveries || 0}
            </Text>
            <Text style={styles.bodyText}>Address: {formatAddress(plan?.address)}</Text>
          </Card>
          <Card>
            <Text style={styles.cardTitle}>Customer</Text>
            <Text style={styles.bodyText}>{customer?.name || "Customer"}</Text>
            <Text style={styles.bodyText}>{customer?.phone || "-"}</Text>
            <Text style={styles.bodyText}>{customer?.email || "-"}</Text>
            <GhostButton
              label="Open Customer"
              onPress={() => onOpenCustomer(customer?.id)}
              disabled={!customer?.id}
            />
          </Card>
          <ListCard
            title="Orders"
            items={orders}
            emptyMessage="No orders linked to this subscription."
            renderItem={(order) => (
              <ListRow
                key={order.id}
                title={formatDate(order.date)}
                subtitle={
                  (order.items || [])
                    .map((item) => `${item.name} (${item.quantity} ${item.unit || ""})`)
                    .join(", ") || "-"
                }
                meta={`${formatCurrency(order.totalAmount)} • ${order.status}`}
              />
            )}
          />
        </>
      ) : null}
    </>
  );
}

function CustomerDetailScreen({ detail, onBack, onOpenPlan }) {
  const customer = detail?.customer;
  const plans = detail?.plans || [];
  const orders = detail?.orders || [];

  return (
    <>
      <GhostButton label="Back to Customers" onPress={onBack} />
      <SectionTitle
        title={customer?.name || "Customer"}
        subtitle={`${customer?.phone || "-"}${customer?.email ? ` • ${customer.email}` : ""}`}
      />
      {!detail ? <InlineMessage message="Unable to load customer details." type="error" /> : null}
      {detail ? (
        <>
          <View style={styles.metricGrid}>
            <MetricCard label="Joined" value={formatDate(customer?.joinedAt)} />
            <MetricCard
              label="Active Plans"
              value={String(plans.filter((plan) => plan.status === "ACTIVE").length)}
            />
            <MetricCard label="Total Plans" value={String(plans.length)} />
            <MetricCard label="Total Orders" value={String(orders.length)} />
          </View>
          <ListCard
            title="Addresses"
            items={customer?.addresses || []}
            emptyMessage="No address saved."
            renderItem={(address, index) => (
              <ListRow
                key={address.id || `${address.line1}-${index}`}
                title={address.title || "Address"}
                subtitle={formatAddress(address)}
                meta={address.landmark || "-"}
              />
            )}
          />
          <ListCard
            title="Plans"
            items={plans}
            emptyMessage="No plans for this customer."
            renderItem={(plan) => (
              <Pressable key={plan.id} onPress={() => onOpenPlan(plan.id)}>
                <ListRow
                  title={plan.product?.name || "Product"}
                  subtitle={`${plan.mode} • ${plan.defaultQuantity} ${plan.product?.unit || ""}`}
                  meta={`${formatDate(plan.startDate)} to ${formatDate(plan.endDate)} • ${
                    plan.status
                  }`}
                />
              </Pressable>
            )}
          />
          <ListCard
            title="Orders"
            items={orders}
            emptyMessage="No orders for this customer."
            renderItem={(order) => (
              <ListRow
                key={order.id}
                title={formatDate(order.date)}
                subtitle={
                  (order.items || [])
                    .map((item) => `${item.name} (${item.quantity} ${item.unit || ""})`)
                    .join(", ") || "-"
                }
                meta={`${formatCurrency(order.totalAmount)} • ${order.status}`}
              />
            )}
          />
        </>
      ) : null}
    </>
  );
}

function ProductEditModal({ visible, form, saving, onClose, onChange, onSave }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.cardTitle}>Edit Product</Text>
          <ScrollView>
            <Field label="Name" value={form.name} onChangeText={(value) => onChange({ name: value })} />
            <Field
              label="Description"
              value={form.description}
              onChangeText={(value) => onChange({ description: value })}
            />
            <Field label="Unit" value={form.unit} onChangeText={(value) => onChange({ unit: value })} />
            <Field
              label="Price"
              value={form.price}
              keyboardType="numeric"
              onChangeText={(value) => onChange({ price: value })}
            />
            <Field
              label="Image URL"
              value={form.imageUrl}
              onChangeText={(value) => onChange({ imageUrl: value })}
            />
            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Active</Text>
              <Switch value={Boolean(form.isActive)} onValueChange={(value) => onChange({ isActive: value })} />
            </View>
          </ScrollView>
          <View style={styles.row}>
            <View style={styles.rowCell}>
              <GhostButton label="Cancel" onPress={onClose} />
            </View>
            <View style={styles.rowCell}>
              <PrimaryButton label={saving ? "Saving..." : "Save"} onPress={onSave} disabled={saving} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function ListCard({ title, items, renderItem, emptyMessage }) {
  return (
    <Card>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {items.length ? items.map(renderItem) : <Text style={styles.emptyText}>{emptyMessage}</Text>}
    </Card>
  );
}

function ListRow({ title, subtitle, meta }) {
  return (
    <View style={styles.listRow}>
      <Text style={styles.listTitle}>{title}</Text>
      {subtitle ? <Text style={styles.listSubtitle}>{subtitle}</Text> : null}
      {meta ? <Text style={styles.listMeta}>{meta}</Text> : null}
    </View>
  );
}

function Card({ children }) {
  return <View style={styles.card}>{children}</View>;
}

function Field({ label, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#7F8A84"
        style={styles.input}
        {...props}
      />
    </View>
  );
}

function SegmentedControl({ label, options, value, onChange }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={styles.segmented}>
        {options.map((option) => (
          <Pressable
            key={option}
            style={[styles.segment, value === option ? styles.segmentActive : null]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.segmentLabel, value === option ? styles.segmentLabelActive : null]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function MetricCard({ label, value }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled }) {
  return (
    <Pressable
      style={[styles.primaryButton, disabled ? styles.buttonDisabled : null]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function GhostButton({ label, onPress, disabled }) {
  return (
    <Pressable
      style={[styles.ghostButton, disabled ? styles.buttonDisabled : null]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.ghostButtonText}>{label}</Text>
    </Pressable>
  );
}

function InlineMessage({ message, type = "info" }) {
  return (
    <View style={[styles.inlineMessage, type === "error" ? styles.inlineMessageError : null]}>
      <Text style={styles.inlineMessageText}>{message}</Text>
    </View>
  );
}

function FlashBanner({ flash }) {
  if (!flash) return null;
  return (
    <View style={[styles.flash, flash.type === "error" ? styles.flashError : styles.flashSuccess]}>
      <Text style={styles.flashText}>{flash.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: "#F4EFE6"
  },
  authShell: {
    flex: 1,
    backgroundColor: "#F4EFE6"
  },
  authContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center"
  },
  bootShell: {
    flex: 1,
    backgroundColor: "#F4EFE6",
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  bootText: {
    color: "#325645",
    fontSize: 16
  },
  eyebrow: {
    color: "#1F5E46",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 8
  },
  authTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#183729",
    marginBottom: 8
  },
  authSubtitle: {
    fontSize: 15,
    color: "#5F6C66",
    marginBottom: 20
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#DDD3C5",
    backgroundColor: "#FCFAF6"
  },
  headerTextWrap: {
    marginBottom: 10
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#183729"
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#5F6C66",
    marginTop: 2
  },
  headerActions: {
    flexDirection: "row",
    gap: 10
  },
  content: {
    padding: 16,
    paddingBottom: 110,
    gap: 14
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  loadingText: {
    color: "#325645"
  },
  sectionHeader: {
    marginBottom: 2
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#183729"
  },
  sectionSubtitle: {
    marginTop: 4,
    color: "#5F6C66",
    fontSize: 14
  },
  card: {
    backgroundColor: "#FCFAF6",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E4D9CA",
    gap: 12
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#183729"
  },
  field: {
    gap: 7
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#325645"
  },
  input: {
    backgroundColor: "#F6F2EA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D9D0C3",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#183729"
  },
  primaryButton: {
    backgroundColor: "#1F5E46",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700"
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: "#C2B8A8",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFDF9"
  },
  ghostButtonText: {
    color: "#325645",
    fontWeight: "700",
    fontSize: 14
  },
  buttonDisabled: {
    opacity: 0.6
  },
  hint: {
    color: "#6B756F",
    fontSize: 13
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  metricCard: {
    width: "48%",
    minWidth: 150,
    backgroundColor: "#E8F0E9",
    borderRadius: 16,
    padding: 14
  },
  metricLabel: {
    fontSize: 12,
    color: "#466255",
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.8
  },
  metricValue: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: "800",
    color: "#143626"
  },
  listRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EFE6DB",
    gap: 4
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#183729"
  },
  listSubtitle: {
    fontSize: 13,
    color: "#5F6C66"
  },
  listMeta: {
    fontSize: 12,
    color: "#1F5E46",
    fontWeight: "700"
  },
  secondaryMeta: {
    fontSize: 13,
    color: "#5F6C66",
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: "#6B756F"
  },
  bodyText: {
    fontSize: 14,
    color: "#42524A",
    lineHeight: 20
  },
  row: {
    flexDirection: "row",
    gap: 10
  },
  rowCell: {
    flex: 1
  },
  segmented: {
    flexDirection: "row",
    gap: 8
  },
  segment: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D9D0C3",
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: "#F6F2EA"
  },
  segmentActive: {
    backgroundColor: "#1F5E46",
    borderColor: "#1F5E46"
  },
  segmentLabel: {
    color: "#466255",
    fontWeight: "700",
    textTransform: "capitalize"
  },
  segmentLabelActive: {
    color: "#FFFFFF"
  },
  inlineMessage: {
    backgroundColor: "#EEF5EF",
    borderRadius: 12,
    padding: 12
  },
  inlineMessageError: {
    backgroundColor: "#FCE7E4"
  },
  inlineMessageText: {
    color: "#5C2A22",
    fontSize: 13
  },
  tabBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: "#FCFAF6",
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: "#DDD3C5"
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F6F2EA"
  },
  tabItemActive: {
    backgroundColor: "#1F5E46"
  },
  tabLabel: {
    color: "#466255",
    fontWeight: "700",
    fontSize: 13
  },
  tabLabelActive: {
    color: "#FFFFFF"
  },
  backBar: {
    position: "absolute",
    right: 12,
    bottom: 86
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(24, 55, 41, 0.35)",
    justifyContent: "flex-end"
  },
  modalCard: {
    maxHeight: "88%",
    backgroundColor: "#FCFAF6",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    gap: 12
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8
  },
  flash: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 54,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  flashSuccess: {
    backgroundColor: "#1F5E46"
  },
  flashError: {
    backgroundColor: "#A33D2A"
  },
  flashText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13
  }
});
