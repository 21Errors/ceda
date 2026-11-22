"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, type RefObject } from "react";
import { Bell, LogOut, Settings, UserRound, X } from "lucide-react";
import { useNotificationsModal } from "@/components/notifications/NotificationsModalContext";
import {
  ActiveDrawerNavigationLink,
  DrawerNavigationLink,
} from "./NavbarLinks";
import type { NavItem } from "./nav-items";

interface NavbarMobileDrawerProps {
  drawerId: string;
  drawerRef: RefObject<HTMLDialogElement | null>;
  drawerScrollerRef: RefObject<HTMLDivElement | null>;
  drawerSheetRef: RefObject<HTMLElement | null>;
  links: readonly NavItem[];
  user: { name?: string | null; email?: string | null } | null;
  initials: string;
  onClose: () => void;
  onSignOut: () => void;
}

export function NavbarMobileDrawer({
  drawerId,
  drawerRef,
  drawerScrollerRef,
  drawerSheetRef,
  links,
  user,
  initials,
  onClose,
  onSignOut,
}: NavbarMobileDrawerProps) {
  const { openNotifications } = useNotificationsModal();
  const userName = user?.name || "Portal account";
  const userEmail = user?.email || "";

  return (
    <dialog
      ref={drawerRef}
      id={drawerId}
      aria-label="Site navigation"
      className="site-drawer"
    >
      <div ref={drawerScrollerRef} className="site-drawer-scroller">
        <nav
          ref={drawerSheetRef}
          aria-label="Mobile navigation"
          className="site-drawer-sheet"
        >
          <div className="flex min-h-18 shrink-0 items-center justify-between gap-3 border-b border-ceda-line bg-white px-5">
            <Link
              href="/"
              aria-label="CEDA Innovation Portal home"
              onClick={onClose}
              className="inline-flex items-center rounded-lg py-1 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ceda-orange"
            >
              <span className="relative block h-9 w-24">
                <Image
                  src="/assets/ceda logo.png"
                  alt="CEDA — Citizen Entrepreneurial Development Agency"
                  fill
                  sizes="96px"
                  className="object-contain object-left"
                />
              </span>
            </Link>

            <button
              type="button"
              autoFocus
              onClick={onClose}
              aria-label="Close navigation menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ceda-burgundy/15 bg-ceda-cream text-ceda-ink transition-colors hover:border-ceda-burgundy/35 hover:bg-ceda-cream-mid hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <div className="site-drawer-body flex-1 space-y-6 overflow-y-auto px-4 py-5">
            <div>
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ceda-muted">
                Explore
              </p>
              <ul className="space-y-1">
                {links.map((item) => (
                  <li key={item.href}>
                    <Suspense
                      fallback={
                        <DrawerNavigationLink item={item} onNavigate={onClose} />
                      }
                    >
                      <ActiveDrawerNavigationLink
                        item={item}
                        onNavigate={onClose}
                      />
                    </Suspense>
                  </li>
                ))}
              </ul>
            </div>

            {user ? (
              <div className="border-t border-ceda-line pt-5">
                <p className="mb-2.5 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ceda-muted">
                  Account
                </p>

                <div className="mb-3 flex items-center gap-3 rounded-xl border border-ceda-burgundy/10 bg-ceda-cream px-3 py-2.5">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ceda-burgundy text-xs font-bold text-white"
                  >
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold leading-tight text-ceda-ink">
                      {userName}
                    </p>
                    {userEmail ? (
                      <p className="mt-0.5 truncate text-xs text-ceda-muted">
                        {userEmail}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <Link
                    href="/profile"
                    onClick={onClose}
                    className="group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ceda-body transition-colors hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                  >
                    <UserRound
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-ceda-muted transition-colors group-hover:text-ceda-burgundy"
                    />
                    <span>My profile</span>
                  </Link>
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => {
                      onClose();
                      openNotifications();
                    }}
                    className="group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-ceda-body transition-colors hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                  >
                    <Bell
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-ceda-muted transition-colors group-hover:text-ceda-burgundy"
                    />
                    <span>Notifications</span>
                  </button>
                  <Link
                    href="/account/settings"
                    onClick={onClose}
                    className="group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ceda-body transition-colors hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                  >
                    <Settings
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-ceda-muted transition-colors group-hover:text-ceda-burgundy"
                    />
                    <span>Account settings</span>
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-ceda-line bg-[#FFFBF7] px-4 py-3.5">
            {user ? (
              <button
                type="button"
                onClick={onSignOut}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-ceda-burgundy/18 bg-white px-4 text-sm font-semibold text-ceda-burgundy transition-colors hover:border-ceda-burgundy/35 hover:bg-[#FFF0E2] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            ) : (
              <div className="grid gap-2">
                <Link
                  href="/signup"
                  onClick={onClose}
                  className="flex min-h-11 items-center justify-center rounded-full bg-ceda-burgundy px-4 text-sm font-semibold text-white transition-colors hover:bg-ceda-burgundy-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex min-h-11 items-center justify-center rounded-full border border-ceda-line bg-white px-4 text-sm font-semibold text-ceda-ink transition-colors hover:border-ceda-burgundy/40 hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </dialog>
  );
}
