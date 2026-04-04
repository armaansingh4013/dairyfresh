import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout.jsx";
import OverviewPage from "../pages/OverviewPage.jsx";
import SubscriptionsPage from "../pages/SubscriptionsPage.jsx";
import DeliveriesPage from "../pages/DeliveriesPage.jsx";
import ProductsPage from "../pages/ProductsPage.jsx";
import CustomersPage from "../pages/CustomersPage.jsx";
import BillingPage from "../pages/BillingPage.jsx";
import ReportsPage from "../pages/ReportsPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </AdminLayout>
    </BrowserRouter>
  );
}
