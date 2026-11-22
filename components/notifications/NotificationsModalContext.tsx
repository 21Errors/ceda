"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { NotificationsModal } from "./NotificationsModal";

interface NotificationsModalContextValue {
  open: boolean;
  unreadCount: number | null;
  openNotifications: () => void;
  closeNotifications: () => void;
  setUnreadCount: (count: number) => void;
}

const NotificationsModalContext =
  createContext<NotificationsModalContextValue | null>(null);

export function NotificationsModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);

  const openNotifications = useCallback(() => setOpen(true), []);
  const closeNotifications = useCallback(() => setOpen(false), []);

  // Open automatically when redirected from /notifications with ?notifications=open
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("notifications") === "open") {
      url.searchParams.delete("notifications");
      window.history.replaceState(null, "", url.toString());
      queueMicrotask(() => setOpen(true));
    }
  }, []);

  return (
    <NotificationsModalContext.Provider
      value={{
        open,
        unreadCount,
        openNotifications,
        closeNotifications,
        setUnreadCount,
      }}
    >
      {children}
      <NotificationsModal
        open={open}
        onClose={closeNotifications}
        onUnreadCountChange={setUnreadCount}
      />
    </NotificationsModalContext.Provider>
  );
}

export function useNotificationsModal() {
  const ctx = useContext(NotificationsModalContext);
  if (!ctx) {
    throw new Error(
      "useNotificationsModal must be used inside NotificationsModalProvider",
    );
  }
  return ctx;
}
