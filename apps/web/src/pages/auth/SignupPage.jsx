import React from "react";
import LoginPage from "../LoginPage.jsx";

export default function SignupPage({ onLogin }) {
  return <LoginPage onLogin={onLogin} mode="signup" />;
}
