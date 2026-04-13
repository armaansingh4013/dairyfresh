import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const timersRef = useRef(new Map());
  const [notifications, setNotifications] = useState([]);

  const dismissNotification = useCallback((id) => {
    const timeoutId = timersRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timersRef.current.delete(id);
    }

    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    ({ message, type = "info", duration = 2600 }) => {
      if (!message) return null;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setNotifications((current) => [...current, { id, message, type }]);

      const timeoutId = window.setTimeout(() => {
        dismissNotification(id);
      }, duration);

      timersRef.current.set(id, timeoutId);
      return id;
    },
    [dismissNotification]
  );

  const value = useMemo(
    () => ({
      notifications,
      notify,
      dismissNotification
    }),
    [dismissNotification, notifications, notify]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const value = useContext(NotificationContext);

  if (!value) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }

  return value;
}
