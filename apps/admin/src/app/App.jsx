import React, { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout.jsx";
import OverviewPage from "../pages/OverviewPage.jsx";
import SubscriptionsPage from "../pages/SubscriptionsPage.jsx";
import SubscriptionDetailPage from "../pages/SubscriptionDetailPage.jsx";
import DeliveriesPage from "../pages/DeliveriesPage.jsx";
import ProductsPage from "../pages/ProductsPage.jsx";
import CustomersPage from "../pages/CustomersPage.jsx";
import CustomerDetailPage from "../pages/CustomerDetailPage.jsx";
import BillingPage from "../pages/BillingPage.jsx";
import ReportsPage from "../pages/ReportsPage.jsx";
import UsersPage from "../pages/UsersPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import DeliveryDashboardPage from "../pages/DeliveryDashboardPage.jsx";
import ToastViewport from "../components/ToastViewport.jsx";
import { NotificationProvider } from "../contexts/NotificationContext.jsx";
import {
  apiGet,
  clearStoredSession,
  readStoredSession,
  writeStoredSession
} from "../services/api.js";

function ProtectedApp({ session, onLogout }) {
  const role = session?.user?.role;

  return (
    <AdminLayout user={session?.user} onLogout={onLogout}>
      <Routes>
        {role === "ADMIN" ? (
          <>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/subscriptions/:planId" element={<SubscriptionDetailPage />} />
            <Route path="/deliveries" element={<DeliveriesPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </>
        ) : null}

        {role === "DELIVERY" ? (
          <>
            <Route path="/" element={<Navigate to="/delivery" replace />} />
            <Route path="/delivery" element={<DeliveryDashboardPage />} />
          </>
        ) : null}

        <Route
          path="*"
          element={<Navigate to={role === "DELIVERY" ? "/delivery" : "/overview"} replace />}
        />
      </Routes>
    </AdminLayout>
  );
}

export default function App() {
  const [session, setSession] = useState(() => readStoredSession());
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    validateSession();
  }, []);

  async function validateSession() {
    if (!session?.token) {
      setAuthReady(true);
      return;
    }

    try {
      const payload = await apiGet("/auth/session");
      if (!["ADMIN", "DELIVERY"].includes(payload.user?.role)) {
        clearStoredSession();
        setSession(null);
        return;
      }
      const nextSession = {
        token: payload.token,
        user: payload.user
      };
      writeStoredSession(nextSession);
      setSession(nextSession);
    } catch {
      clearStoredSession();
      setSession(null);
    } finally {
      setAuthReady(true);
    }
  }

  function handleLogin(sessionPayload) {
    const nextSession = {
      token: sessionPayload.token,
      user: sessionPayload.user
    };
    writeStoredSession(nextSession);
    setSession(nextSession);
    setAuthReady(true);
  }

  function handleLogout() {
    clearStoredSession();
    setSession(null);
    setAuthReady(true);
  }

  if (!authReady) {
    return <div className="page-loader">Checking your session...</div>;
  }

  return (
    <BrowserRouter>
      <NotificationProvider>
        {session?.user ? (
          <ProtectedApp session={session} onLogout={handleLogout} />
        ) : (
          <Routes>
            <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
          </Routes>
        )}
        <ToastViewport />
      </NotificationProvider>
    </BrowserRouter>
  );
}
