import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../services/api.js";
import { useNotifications } from "../contexts/NotificationContext.jsx";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "DELIVERY"
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const { notify } = useNotifications();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const payload = await apiGet("/admin/users");
      setUsers(Array.isArray(payload) ? payload : []);
    } catch {
      setUsers([]);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("");

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password.trim()) {
      const message = "Name, email, phone number, and password are required.";
      setStatus(message);
      notify({ type: "error", message });
      return;
    }

    setLoading(true);
    try {
      const created = await apiPost("/admin/users", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password.trim(),
        role: form.role
      });

      const message = `User created. Username: ${created.username}`;
      setStatus(message);
      notify({ type: "success", message });
      setForm(INITIAL_FORM);
      await loadUsers();
    } catch (error) {
      const message = error.message || "Unable to create user.";
      setStatus(message);
      notify({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Users</h1>
          <p>Create admin and delivery accounts with password-based login.</p>
        </div>
      </header>

      <section className="sheet">
        <h2>Create User</h2>
        <form className="user-form" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Phone Number</span>
            <input
              type="text"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Role</span>
            <select
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
            >
              <option value="DELIVERY">Delivery</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Add User"}
          </button>
        </form>
        {status ? <p className="empty">{status}</p> : null}
      </section>

      <section className="sheet">
        <h2>Active Users</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name || "-"}</td>
                <td>{user.username || "-"}</td>
                <td>{user.email || "-"}</td>
                <td>{user.phone || "-"}</td>
                <td>{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length ? <p className="empty">No admin or delivery users found.</p> : null}
      </section>
    </>
  );
}
