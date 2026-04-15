import React from "react";
import { useNotifications } from "../contexts/NotificationContext.jsx";

export default function ToastViewport() {
  const { notifications, dismissNotification } = useNotifications();

  if (!notifications.length) {
    return null;
  }

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {notifications.map((notification) => (
        <button
          key={notification.id}
          type="button"
          className={`toast toast-${notification.type}`}
          onClick={() => dismissNotification(notification.id)}
        >
          <span className="toast-dot" aria-hidden="true" />
          <span>{notification.message}</span>
        </button>
      ))}
    </div>
  );
}
