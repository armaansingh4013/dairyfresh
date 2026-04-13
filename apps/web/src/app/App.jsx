import React, { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MarketingLayout from "../layouts/MarketingLayout.jsx";
import AppLayout from "../layouts/AppLayout.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

import HomePage from "../pages/marketing/HomePage.jsx";
import ProductsPage from "../pages/marketing/ProductsPage.jsx";
import AboutPage from "../pages/marketing/AboutPage.jsx";
import ContactPage from "../pages/marketing/ContactPage.jsx";
import PrivacyPage from "../pages/marketing/PrivacyPage.jsx";

import LoginPage from "../pages/LoginPage.jsx";
import SignupPage from "../pages/auth/SignupPage.jsx";

import DashboardPage from "../pages/DashboardPage.jsx";
import SubscriptionsPage from "../pages/SubscriptionsPage.jsx";
import BillingPage from "../pages/BillingPage.jsx";
import CartPage from "../pages/CartPage.jsx";
import ProfilePage from "../pages/app/ProfilePage.jsx";
import OrdersPage from "../pages/app/OrdersPage.jsx";
import SubscriptionWizard from "../pages/app/SubscriptionWizard.jsx";
import SubscriptionDetailPage from "../pages/app/SubscriptionDetailPage.jsx";
import { apiGet } from "../services/api.js";
import { CartProvider } from "../contexts/CartContext.jsx";
import { NotificationProvider } from "../contexts/NotificationContext.jsx";
import ToastViewport from "../components/ToastViewport.jsx";

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const stored = window.localStorage.getItem("dairy-session");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [authReady, setAuthReady] = useState(false);
  const user = session?.user || null;

  useEffect(() => {
    async function restoreSession() {
      if (!session?.token) {
        setAuthReady(true);
        return;
      }

      try {
        const payload = await apiGet("/auth/session");
        const nextSession = {
          token: payload.token,
          user: payload.user
        };
        setSession(nextSession);
        window.localStorage.setItem("dairy-session", JSON.stringify(nextSession));
      } catch {
        setSession(null);
        window.localStorage.removeItem("dairy-session");
      } finally {
        setAuthReady(true);
      }
    }

    restoreSession();
  }, []);

  function handleLoginSuccess(sessionPayload) {
    const nextSession = {
      token: sessionPayload.token,
      user: sessionPayload.user
    };
    setSession(nextSession);
    window.localStorage.setItem("dairy-session", JSON.stringify(nextSession));
  }

  function handleLogout() {
    setSession(null);
    window.localStorage.removeItem("dairy-session");
  }

  if (!authReady) {
    return <div className="page-loader">Checking your session...</div>;
  }

  return (
    <BrowserRouter>
      <NotificationProvider>
        <CartProvider>
          <Routes>
            <Route
              path="/*"
              element={
                <MarketingLayout user={user} onLogout={handleLogout}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/cart" element={<CartPage user={user} />} />
                    <Route path="/login" element={<LoginPage onLogin={handleLoginSuccess} />} />
                    <Route path="/signup" element={<SignupPage onLogin={handleLoginSuccess} />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute user={user}>
                          <Navigate to="/app/dashboard" replace />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </MarketingLayout>
              }
            />

            <Route
              path="/app/*"
              element={
                <ProtectedRoute user={user}>
                  <AppLayout user={user} onLogout={handleLogout}>
                    <Routes>
                      <Route path="dashboard" element={<DashboardPage user={user} />} />
                      <Route path="subscriptions" element={<SubscriptionsPage user={user} />} />
                      <Route
                        path="subscriptions/cancelled"
                        element={<Navigate to="/app/subscriptions?tab=cancelled" replace />}
                      />
                      <Route
                        path="subscriptions/completed"
                        element={<Navigate to="/app/subscriptions?tab=completed" replace />}
                      />
                      <Route
                        path="subscriptions/history"
                        element={<Navigate to="/app/subscriptions?tab=history" replace />}
                      />
                      <Route path="subscriptions/:planId" element={<SubscriptionDetailPage user={user} />} />
                      <Route path="billing" element={<BillingPage user={user} />} />
                      <Route path="cart" element={<CartPage user={user} />} />
                      <Route path="profile" element={<ProfilePage user={user} />} />
                      <Route path="orders" element={<OrdersPage user={user} />} />
                      <Route path="ongoing" element={<Navigate to="/app/subscriptions" replace />} />
                      <Route path="start" element={<SubscriptionWizard user={user} />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
          <ToastViewport />
        </CartProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}
