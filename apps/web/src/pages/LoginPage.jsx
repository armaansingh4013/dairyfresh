import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../services/api.js";

export default function LoginPage({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

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
      setOtpSent(true);
      setStatus(payload.message || "OTP sent.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setStatus("");

    if (!phone.trim() || !otp.trim()) {
      setStatus("Enter phone and OTP.");
      return;
    }

    try {
      const payload = await apiPost("/auth/verify-otp", {
        phone: phone.trim(),
        otp: otp.trim()
      });
      onLogin(payload);
      navigate("/app/dashboard");
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <section className="section-card auth-layout">
      <div className="auth-copy">
        <p className="section-kicker">Login</p>
        <h2>Sign in with phone + OTP</h2>
        <p className="lead compact">Use any OTP for now (mock).</p>
      </div>
      <form className="auth-form" style={{display: "flex", flexDirection:"column", gap:"18px"}} onSubmit={handleLogin}>
        <label className="field">
          <span>Phone</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <button className="ghost" type="button" onClick={handleRequestOtp}>
          {otpSent ? "Resend OTP" : "Send OTP"}
        </button>
        <label className="field">
          <span>OTP</span>
          <input value={otp} onChange={(e) => setOtp(e.target.value)} />
        </label>
        <button className="primary" type="submit">
          Login
        </button>
        {status && <p className="message">{status}</p>}
      </form>
    </section>
  );
}
