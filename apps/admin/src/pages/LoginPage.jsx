import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../services/api.js";
import { useNotifications } from "../contexts/NotificationContext.jsx";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { notify } = useNotifications();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      const message = "Enter username and password.";
      setStatus(message);
      notify({ type: "error", message });
      return;
    }

    setLoading(true);
    setStatus("");
    try {
      const payload = await apiPost("/auth/staff-login", {
        username: username.trim(),
        password: password.trim()
      });

      if (!["ADMIN", "DELIVERY"].includes(payload.user?.role)) {
        const message = "Only admin and delivery users can sign in here.";
        setStatus(message);
        notify({ type: "error", message });
        return;
      }

      onLogin(payload);
      notify({ type: "success", message: "Logged in successfully." });
      navigate(payload.user.role === "DELIVERY" ? "/delivery" : "/overview", { replace: true });
    } catch (error) {
      setStatus(error.message);
      notify({ type: "error", message: error.message || "Unable to sign in." });
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
          Demo logins: admin / admin123 and delivery / delivery123.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="admin"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          {status ? <p className="empty">{status}</p> : null}
        </form>
      </div>
    </section>
  );
}
