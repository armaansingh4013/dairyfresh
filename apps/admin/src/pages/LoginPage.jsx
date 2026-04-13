import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../services/api.js";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function requestOtp() {
    if (!email.trim()) {
      setStatus("Enter email first.");
      return;
    }

    setLoading(true);
    setStatus("");
    try {
      const payload = await apiPost("/auth/request-otp", { email: email.trim() });
      setOtpSent(true);
      setStatus(payload.message || "OTP sent. Demo OTP is 1111 for @dairy.local users.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !otp.trim()) {
      setStatus("Enter email and OTP.");
      return;
    }

    setLoading(true);
    setStatus("");
    try {
      const payload = await apiPost("/auth/verify-otp", {
        email: email.trim(),
        otp: otp.trim()
      });

      if (!["ADMIN", "DELIVERY"].includes(payload.user?.role)) {
        setStatus("Only admin and delivery users can sign in here.");
        return;
      }

      onLogin(payload);
      navigate(payload.user.role === "DELIVERY" ? "/delivery" : "/overview", { replace: true });
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="login-shell">
      <div className="login-card">
        <p className="section-kicker">Secure Access</p>
        <h1>Admin Dashboard Login</h1>
        <p className="status-text">
          Demo users: admin@dairy.local and delivery@dairy.local. Demo OTP: 1111.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@dairy.local"
            />
          </label>

          <button type="button" onClick={requestOtp} disabled={loading}>
            {loading && !otpSent ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
          </button>

          <label>
            <span>OTP</span>
            <input
              type="text"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="1111"
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading && otpSent ? "Logging in..." : "Login"}
          </button>
          {status ? <p className="empty">{status}</p> : null}
        </form>
      </div>
    </section>
  );
}
