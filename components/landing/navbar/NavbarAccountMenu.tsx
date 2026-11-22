"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { useNotificationsModal } from "@/components/notifications/NotificationsModalContext";
import { hasNativePopover, positionAccountFallback } from "./nav-items";

interface NavbarAccountMenuProps {
  user: { name?: string | null; email?: string | null } | null;
  initials: string;
  onSignOut: () => void;
}

export function NavbarAccountMenu({
  user,
  initials,
  onSignOut,
}: NavbarAccountMenuProps) {
  const accountPanelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const { openNotifications } = useNotificationsModal();

  const closeAccountPanel = useCallback(() => {
    const panel = popoverRef.current;
    if (!panel) return;
    if (hasNativePopover()) {
      if (panel.matches(":popover-open")) {
        panel.hidePopover();
      }
    } else {
      panel.removeAttribute("data-popover-open");
      setAccountOpen(false);
    }
  }, []);

  useEffect(() => {
    const panel = popoverRef.current;
    const trigger = triggerRef.current;
    if (!panel || !trigger) return;

    const handleToggle = (event: Event) => {
      const toggleEvent = event as ToggleEvent;
      const open = toggleEvent.newState === "open";
      setAccountOpen(open);
      if (open) {
        positionAccountFallback(panel, trigger);
      }
    };

    panel.addEventListener("toggle", handleToggle);
    return () => panel.removeEventListener("toggle", handleToggle);
  }, [user]);

  useEffect(() => {
    if (hasNativePopover() || !accountOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAccountPanel();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        !triggerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        closeAccountPanel();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [accountOpen, closeAccountPanel]);

  if (!user) {
    return (
      <div className="site-header-actions">
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center rounded-full px-3.5 text-sm font-semibold text-ceda-ink transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-ceda-burgundy px-5 text-sm font-semibold text-white shadow-xs transition hover:bg-ceda-burgundy-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
        >
          Register
        </Link>
      </div>
    );
  }

  const userName = user.name || "Portal account";
  const userEmail = user.email || "";

  return (
    <div className="site-header-actions">
      <button
        ref={triggerRef}
        type="button"
        popoverTarget={accountPanelId}
        popoverTargetAction="toggle"
        aria-controls={accountPanelId}
        aria-expanded={accountOpen}
        onClick={() => {
          if (!hasNativePopover() && popoverRef.current) {
            const nextOpen = !accountOpen;
            if (nextOpen) {
              popoverRef.current.setAttribute("data-popover-open", "true");
              positionAccountFallback(popoverRef.current, triggerRef.current!);
            } else {
              popoverRef.current.removeAttribute("data-popover-open");
            }
            setAccountOpen(nextOpen);
          }
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-transparent py-1 pl-1.5 pr-3 text-sm font-medium text-ceda-ink transition hover:border-ceda-line hover:bg-ceda-cream focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-ceda-burgundy text-xs font-bold text-white"
        >
          {initials}
        </span>
        <span className="max-w-28 truncate">{user.name || "Account"}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 text-ceda-muted transition-transform duration-150 ${
            accountOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        ref={popoverRef}
        id={accountPanelId}
        popover="auto"
        className="site-account-popover"
      >
        <div className="border-b border-ceda-line px-3 py-2.5">
          <p className="truncate text-sm font-semibold text-ceda-ink">{userName}</p>
          {userEmail ? (
            <p className="mt-0.5 truncate text-xs text-ceda-muted">{userEmail}</p>
          ) : null}
        </div>
        <div className="mt-1 grid gap-0.5">
          <Link
            href="/profile"
            onClick={closeAccountPanel}
            className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ceda-body transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
          >
            <UserRound aria-hidden="true" className="h-4 w-4 text-ceda-muted" />
            <span>My profile</span>
          </Link>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => {
              closeAccountPanel();
              openNotifications();
            }}
            className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-ceda-body transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
          >
            <Bell aria-hidden="true" className="h-4 w-4 text-ceda-muted" />
            <span>Notifications</span>
          </button>
          <Link
            href="/account/settings"
            onClick={closeAccountPanel}
            className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ceda-body transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
          >
            <Settings aria-hidden="true" className="h-4 w-4 text-ceda-muted" />
            <span>Account settings</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              closeAccountPanel();
              onSignOut();
            }}
            className="mt-1 flex min-h-10 w-full items-center gap-3 rounded-xl border-t border-ceda-line px-3 pt-1 text-left text-sm font-semibold text-ceda-burgundy transition hover:bg-ceda-cream focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
