/**
 * Custom Notifications Hook
 * Manages notification state and provides methods to show/hide notifications
 */
"use client";

import { useState, useCallback } from "react";
import { NotificationData, NotificationType } from "~~/components/CustomNotification";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = useCallback((type: NotificationType, title: string, message: string, duration?: number) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification: NotificationData = {
      id,
      type,
      title,
      message,
      duration,
    };

    setNotifications(prev => [...prev, notification]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods for different notification types
  const showSuccess = useCallback(
    (title: string, message: string, duration?: number) => {
      return addNotification("success", title, message, duration);
    },
    [addNotification],
  );

  const showError = useCallback(
    (title: string, message: string, duration?: number) => {
      return addNotification("error", title, message, duration);
    },
    [addNotification],
  );

  const showWarning = useCallback(
    (title: string, message: string, duration?: number) => {
      return addNotification("warning", title, message, duration);
    },
    [addNotification],
  );

  const showInfo = useCallback(
    (title: string, message: string, duration?: number) => {
      return addNotification("info", title, message, duration);
    },
    [addNotification],
  );

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
