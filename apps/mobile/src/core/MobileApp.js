import React, { useEffect, useMemo, useState } from "react";
import { Alert, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import BottomNav from "../components/BottomNav";
import BillingScreen from "../features/billing/BillingScreen";
import LoginScreen from "../features/auth/LoginScreen";
import DeliveriesScreen from "../features/deliveries/DeliveriesScreen";
import HomeScreen from "../features/home/HomeScreen";
import PlansScreen from "../features/plans/PlansScreen";
import ProfileScreen from "../features/profile/ProfileScreen";
import { colors } from "../theme";
import { apiGet, apiPatch, apiPost } from "../services/api";

const tabs = [
  { key: "home", label: "Home", icon: "H" },
  { key: "plans", label: "Plans", icon: "P" },
  { key: "deliveries", label: "Drops", icon: "D" },
  { key: "billing", label: "Bills", icon: "B" },
  { key: "profile", label: "Me", icon: "M" }
];

export default function MobileApp() {
  const [activeTab, setActiveTab] = useState("home");
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadAppData(session.user.id, session.token);
    }
  }, [session?.token, session?.user?.id]);

  async function loadAppData(userId, token = session?.token) {
    try {
      const [summaryPayload, productPayload] = await Promise.all([
        apiGet(`/users/${userId}/summary`, token),
        apiGet("/products", token)
      ]);
      setSummary(summaryPayload);
      setProducts(Array.isArray(productPayload) ? productPayload : []);
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleRequestOtp() {
    setStatus("");

    if (!phone.trim()) {
      setStatus("Enter phone first.");
      return;
    }

    try {
      const payload = await apiPost("/auth/request-otp", {
        phone: phone.trim()
      });
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

    setLoading(true);
    try {
      const payload = await apiPost("/auth/verify-otp", {
        phone: phone.trim(),
        otp: otp.trim()
      });
      setSession(payload);
      setOtp("");
      setActiveTab("home");
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setSession(null);
    setSummary(null);
    setProducts([]);
    setPhone("");
    setOtp("");
    setOtpRequested(false);
    setStatus("");
    setActiveTab("home");
  }

  const activePlan = useMemo(() => {
    const plans = summary?.plans || [];
    return plans.find((plan) => plan.status === "ACTIVE") || plans[0] || null;
  }, [summary]);

  const weeklyPlan = useMemo(() => buildWeeklyPlan(activePlan), [activePlan]);
  const monthlyEstimate = useMemo(() => {
    if (!activePlan?.product?.price) return 0;
    return weeklyPlan.reduce((sum, day) => sum + day.quantity, 0) * activePlan.product.price * 4.3;
  }, [activePlan, weeklyPlan]);
  const totalLiters = useMemo(
    () => weeklyPlan.reduce((sum, day) => sum + (day.active ? day.quantity : 0), 0),
    [weeklyPlan]
  );

  const homeProducts = useMemo(
    () =>
      products.map((product) => ({
        ...product,
        tag: product.isActive ? "Active" : "Inactive"
      })),
    [products]
  );

  const nextDelivery = useMemo(() => buildNextDelivery(summary?.deliveries || []), [summary]);
  const deliveries = useMemo(
    () => buildDeliveryCards(summary?.deliveries || []),
    [summary]
  );
  const billing = useMemo(() => buildBilling(summary?.invoices || []), [summary]);
  const profile = useMemo(
    () => buildProfile(summary?.user, summary?.addresses || [], activePlan),
    [summary, activePlan]
  );
  const stats = useMemo(
    () => buildStats(summary?.deliveries || [], summary?.invoices || [], activePlan),
    [summary, activePlan]
  );

  async function updateDayQuantity(dayKey, delta) {
    const day = weeklyPlan.find((item) => item.key === dayKey);
    if (!day || !activePlan || !session?.token) return;

    const quantity = Math.max(0, Number((day.quantity + delta).toFixed(1)));
    await savePlanDay(day.date, quantity);
  }

  async function toggleDay(dayKey) {
    const day = weeklyPlan.find((item) => item.key === dayKey);
    if (!day || !activePlan || !session?.token) return;

    const quantity = day.active ? 0 : Math.max(1, day.quantity || activePlan.defaultQuantity || 1);
    await savePlanDay(day.date, quantity);
  }

  async function savePlanDay(date, quantity) {
    if (!activePlan || !session?.token) return;

    try {
      await apiPost(
        `/plans/${activePlan.id}/days`,
        {
          days: [
            {
              date,
              quantity
            }
          ]
        },
        session.token
      );
      await loadAppData(session.user.id);
    } catch (error) {
      Alert.alert("Unable to update plan", error.message);
    }
  }

  async function setPlanPaused(updater) {
    if (!activePlan || !session?.token) return;

    const currentValue = activePlan.status === "PAUSED";
    const nextValue = typeof updater === "function" ? updater(currentValue) : Boolean(updater);

    try {
      await apiPatch(
        `/plans/${activePlan.id}`,
        { status: nextValue ? "PAUSED" : "ACTIVE" },
        session.token
      );
      await loadAppData(session.user.id);
    } catch (error) {
      Alert.alert("Unable to update plan", error.message);
    }
  }

  async function payCurrentDue() {
    if (!billing.currentInvoiceId || !session?.token) return;

    try {
      await apiPost(
        `/invoices/${billing.currentInvoiceId}/payments`,
        { provider: "UPI" },
        session.token
      );
      await loadAppData(session.user.id);
    } catch (error) {
      Alert.alert("Unable to pay invoice", error.message);
    }
  }

  function renderScreen() {
    switch (activeTab) {
      case "plans":
        return (
          <PlansScreen
            monthlyEstimate={monthlyEstimate}
            planPaused={activePlan?.status === "PAUSED"}
            setPlanPaused={setPlanPaused}
            totalLiters={totalLiters}
            weeklyPlan={weeklyPlan}
            onAdjustQuantity={updateDayQuantity}
            onToggleDay={toggleDay}
          />
        );
      case "deliveries":
        return <DeliveriesScreen deliveries={deliveries} />;
      case "billing":
        return <BillingScreen billing={billing} onPayCurrentDue={payCurrentDue} />;
      case "profile":
        return <ProfileScreen profile={profile} onLogout={handleLogout} />;
      case "home":
      default:
        return (
          <HomeScreen
            products={homeProducts}
            stats={stats}
            totalLiters={totalLiters}
            monthlyEstimate={monthlyEstimate}
            nextDelivery={nextDelivery}
          />
        );
    }
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
            loading={loading}
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
        {status ? <Text style={styles.status}>{status}</Text> : null}
        <View style={styles.content}>{renderScreen()}</View>
        <BottomNav activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />
      </View>
    </SafeAreaView>
  );
}

function buildWeeklyPlan(plan) {
  if (!plan) {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overrides = Object.fromEntries(
    (plan.days || []).map((day) => [toDateKey(day.date), Number(day.quantity || 0)])
  );

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    const key = toDateKey(date);
    const baseQuantity =
      plan.mode === "CUSTOM" ? 0 : Number(plan.defaultQuantity || 0);
    const quantity = Number(overrides[key] ?? baseQuantity);

    return {
      key,
      date: key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      quantity,
      active: quantity > 0
    };
  });
}

function buildStats(deliveries, invoices, activePlan) {
  const dueInvoice = invoices.find((invoice) => invoice.status !== "PAID");
  const pendingCount = deliveries.filter((delivery) => delivery.status === "PENDING").length;

  return [
    {
      label: "Plan",
      value: activePlan?.product?.name || "No active plan",
      tone: "success"
    },
    {
      label: "Pending drops",
      value: String(pendingCount),
      tone: "default"
    },
    {
      label: "Due now",
      value: dueInvoice ? `INR ${dueInvoice.totalAmount}` : "Clear",
      tone: "warning"
    }
  ];
}

function buildNextDelivery(deliveries) {
  const today = new Date();

  const next = deliveries.find(
    (delivery) =>
      delivery.status !== "CANCELLED" && new Date(delivery.date).getTime() >= today.getTime()
  );

  if (!next) {
    return {
      title: "No upcoming delivery",
      time: "Waiting for a new plan",
      address: "Add or resume a subscription to generate deliveries.",
      items: "No items scheduled",
      status: "Pending"
    };
  }

  return {
    title: new Date(next.date).toLocaleDateString(undefined, {
      weekday: "long"
    }),
    time: "6:00 AM - 7:00 AM",
    address: next.address
      ? `${next.address.line1}, ${next.address.city}`
      : "Default address",
    items: `${next.quantity} ${next.product?.unit || "L"} ${next.product?.name || "Product"}`,
    status: next.status === "DELIVERED" ? "Delivered" : "On route"
  };
}

function buildDeliveryCards(deliveries) {
  return deliveries.slice(-6).reverse().map((delivery) => ({
    id: delivery.id,
    title: new Date(delivery.date).toLocaleDateString(undefined, {
      weekday: "long"
    }),
    time: "6:00 AM - 7:00 AM",
    address: delivery.address
      ? `${delivery.address.line1}, ${delivery.address.city}`
      : "Default address",
    items: `${delivery.quantity} ${delivery.product?.unit || "L"} ${delivery.product?.name || "Product"}`,
    status:
      delivery.status === "DELIVERED"
        ? "Delivered"
        : delivery.status === "CANCELLED"
          ? "Skipped"
          : "Scheduled"
  }));
}

function buildBilling(invoices) {
  const currentDue = invoices.find((invoice) => invoice.status !== "PAID") || null;

  return {
    currentDue: currentDue?.totalAmount || 0,
    currentInvoiceId: currentDue?.id || null,
    nextDebit: currentDue ? `${String(currentDue.month).padStart(2, "0")}/${currentDue.year}` : "No due invoice",
    paymentMethod: "UPI Autopay",
    invoices: invoices.map((invoice) => ({
      id: invoice.id,
      month: `${String(invoice.month).padStart(2, "0")}/${invoice.year}`,
      total: invoice.totalAmount,
      status: invoice.status
    }))
  };
}

function buildProfile(user, addresses, activePlan) {
  const defaultAddress =
    addresses.find((address) => address.isDefault) || addresses[0] || null;

  return {
    name: user?.name || "Customer",
    phone: user?.phone || "-",
    plan: activePlan?.product?.name || "No active plan",
    address: defaultAddress
      ? `${defaultAddress.line1}, ${defaultAddress.city}, ${defaultAddress.state}`
      : "No address saved",
    preferences: [
      user?.email ? `Email: ${user.email}` : "Add email from the web profile page.",
      defaultAddress ? `Default address: ${defaultAddress.title}` : "Add a delivery address.",
      activePlan ? `Current plan status: ${activePlan.status}` : "Create a plan to start deliveries."
    ]
  };
}

function toDateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  shell: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 8
  },
  status: {
    paddingHorizontal: 18,
    paddingTop: 12,
    fontSize: 13,
    color: colors.muted
  }
});
