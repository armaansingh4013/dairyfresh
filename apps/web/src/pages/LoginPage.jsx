import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiPost } from "../services/api.js";
import { useNotifications } from "../contexts/NotificationContext.jsx";

function isEmailValue(value) {
  return /\S+@\S+\.\S+/.test(value.trim());
}

function buildAuthPayload(contact, name) {
  const trimmedContact = contact.trim();
  const trimmedName = name.trim();
  const payload = isEmailValue(trimmedContact)
    ? { email: trimmedContact }
    : { phone: trimmedContact };

  if (trimmedName) {
    payload.name = trimmedName;
  }

  return payload;
}

export default function LoginPage({ onLogin, mode = "login" }) {
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { notify } = useNotifications();

  async function handleRequestOtp() {
    setStatus("");

    if (!contact.trim()) {
      setStatus(isSignup ? "Enter email or phone first." : "Enter phone or email first.");
      return;
    }
    if(!isEmailValue(contact.trim())){
      setStatus("Enter a valid email.");
      return;
    }
    if (isSignup && !name.trim()) {
      setStatus("Enter name first.");
      return;
    }

    setRequestingOtp(true);
    try {
      const payload = await apiPost("/auth/request-otp", buildAuthPayload(contact, name));
      setOtpSent(true);
      setStatus(payload.message || "OTP sent.");
      notify({ type: "success", message: payload.message || "OTP sent successfully." });
    } catch (error) {
      setStatus(error.message);
      notify({ type: "error", message: error.message || "Unable to send OTP." });
    } finally {
      setRequestingOtp(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setStatus("");

    if (!contact.trim() || !otp.trim()) {
      setStatus(isSignup ? "Enter name, email or phone, and OTP." : "Enter phone or email and OTP.");
      return;
    }

    if (isSignup && !name.trim()) {
      setStatus("Enter name, email or phone, and OTP.");
      return;
    }

    setVerifyingOtp(true);
    try {
      const payload = await apiPost("/auth/verify-otp", {
        ...buildAuthPayload(contact, name),
        otp: otp.trim()
      });
      onLogin(payload);
      notify({ type: "success", message: isSignup ? "Account created successfully." : "Logged in successfully." });
      navigate(searchParams.get("redirect") || "/app/dashboard");
    } catch (error) {
      setStatus(error.message);
      notify({ type: "error", message: error.message || "Unable to verify OTP." });
    } finally {
      setVerifyingOtp(false);
    }
  }

  return (
    <section className="section-card auth-layout">
      <div className="auth-copy">
        <p className="section-kicker">{isSignup ? "Signup" : "Login"}</p>
        <h2>{isSignup ? "Create account with name + OTP" : "Sign in with phone or email + OTP"}</h2>
        <p className="lead compact">
          {isSignup
            ? "Enter your name and either a phone number or email address."
            : "Use your phone number or email address to receive an OTP."}
        </p>
      </div>
      <form className="auth-form" style={{display: "flex", flexDirection:"column", gap:"18px"}} onSubmit={handleLogin}>
        {isSignup ? (
          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        ) : null}
        <label className="field">
          <span>Email</span>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="name@example.com"
          />
        </label>
        {status && <p className="message">{status}</p>}
        <button className="ghost" type="button" onClick={handleRequestOtp} disabled={requestingOtp || verifyingOtp}>
          {requestingOtp ? <span className="button-spinner" aria-hidden="true" /> : null}
          {requestingOtp ? "Sending OTP..." : otpSent ? "Resend OTP" : "Send OTP"}
        </button>
        <label className="field">
          <span>OTP</span>
          <input value={otp} onChange={(e) => setOtp(e.target.value)} />
        </label>
        <button className="primary" type="submit" disabled={verifyingOtp || requestingOtp}>
          {verifyingOtp ? <span className="button-spinner" aria-hidden="true" /> : null}
          {verifyingOtp ? (isSignup ? "Creating account..." : "Logging in...") : isSignup ? "Create account" : "Login"}
        </button>
        {/* {status && <p className="message" style={{color:"Red"}}>{status}</p>} */}
      </form>
    </section>
  );
}
