"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  House,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { authClient } from "@/lib/auth-client";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

const PUBLIC_NAVIGATION: readonly NavItem[] = [
  { label: "Home", href: "/", icon: House },
  { label: "News", href: "/news", icon: Newspaper },
  { label: "Guidelines", href: "/guidelines", icon: BookOpen },
  { label: "About", href: "/about", icon: Info },
  { label: "FAQ", href: "/faq", icon: CircleHelp },
];

function isCurrentPath(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name?: string | null, email?: string | null) {
  return (name || email || "U")
    .trim()
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

function positionAccountFallback(popover: HTMLElement, trigger: HTMLElement) {
  if (
    typeof CSS !== "undefined" &&
    CSS.supports("position-area", "block-end")
  ) {
    return;
  }

  const triggerRect = trigger.getBoundingClientRect();
  const panelRect = popover.getBoundingClientRect();
  const margin = 12;

  let left = triggerRect.right - panelRect.width;
  left = Math.max(
    margin,
    Math.min(left, window.innerWidth - panelRect.width - margin),
  );

  let top = triggerRect.bottom + 8;
  if (top + panelRect.height > window.innerHeight - margin) {
    const above = triggerRect.top - panelRect.height - 8;
    if (above >= margin) top = above;
  }

  popover.style.left = `${Math.round(left)}px`;
  popover.style.top = `${Math.round(top)}px`;
}

function NavigationLink({
  item,
  active = false,
  onNavigate,
}: {
  item: NavItem;
  active?: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className="site-nav-link">
      <span>{item.label}</span>
    </Link>
  );
}

function ActiveNavigationLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  return (
    <NavigationLink
      item={item}
      active={isCurrentPath(pathname, item.href)}
      onNavigate={onNavigate}
    />
  );
}

function DrawerNavigationLink({
  item,
  active = false,
  onNavigate,
}: {
  item: NavItem;
  active?: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={`group flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-[0.9375rem] transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange ${
        active
          ? "bg-[#FFF0E2] font-semibold text-ceda-burgundy"
          : "font-medium text-ceda-ink hover:bg-ceda-cream hover:text-ceda-burgundy"
      }`}>
      <span className="flex items-center gap-3">
        <Icon
          aria-hidden={true}
          className={`h-4.5 w-4.5 shrink-0 transition-colors ${
            active
              ? "text-ceda-burgundy"
              : "text-ceda-muted group-hover:text-ceda-burgundy"
          }`}
        />
        <span>{item.label}</span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className={`h-4 w-4 shrink-0 transition-transform duration-150 ${
          active
            ? "text-ceda-burgundy"
            : "text-ceda-muted/50 group-hover:translate-x-0.5 group-hover:text-ceda-burgundy"
        }`}
      />
    </Link>
  );
}

function ActiveDrawerNavigationLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  return (
    <DrawerNavigationLink
      item={item}
      active={isCurrentPath(pathname, item.href)}
      onNavigate={onNavigate}
    />
  );
}

export function Navbar() {
  const drawerId = "primary-site-drawer";
  const accountPanelId = useId();
  const headerRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const drawerScrollerRef = useRef<HTMLDivElement>(null);
  const drawerSheetRef = useRef<HTMLElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const accountPopoverRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const lastHeaderWidthRef = useRef(0);
  const isWideRef = useRef(false);
  const drawerVisibleRef = useRef(false);

  const { data: session } = authClient.useSession();
  const router = useRouter();

  const links: readonly NavItem[] = session?.user
    ? [
        PUBLIC_NAVIGATION[0],
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        ...PUBLIC_NAVIGATION.slice(1),
      ]
    : PUBLIC_NAVIGATION;

  const hasNativePopover = useCallback(
    () =>
      typeof HTMLElement !== "undefined" &&
      Object.hasOwn(HTMLElement.prototype, "popover"),
    [],
  );

  const openMobileDrawer = useCallback(async () => {
    const drawer = drawerRef.current;
    const scroller = drawerScrollerRef.current;
    if (!drawer || !scroller || drawer.open) return;

    drawerVisibleRef.current = false;
    drawer.showModal();

    // Ensure the drawer starts at the closed stop (left: 0) before sliding in from the right edge.
    if (scroller.scrollLeft !== 0) {
      scroller.scrollTo({ left: 0, behavior: "instant" });
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() =>
          window.requestAnimationFrame(() => resolve()),
        );
      });
    }

    scroller.scrollTo({ left: scroller.scrollWidth, behavior: "auto" });
  }, []);

  const closeMobileDrawer = useCallback(() => {
    const drawer = drawerRef.current;
    const scroller = drawerScrollerRef.current;
    if (!drawer || !scroller || !drawer.open) return;
    scroller.scrollTo({ left: 0, behavior: "auto" });
  }, []);

  const closeAccountPanel = useCallback(() => {
    const panel = accountPopoverRef.current;
    if (!panel) return;
    if (hasNativePopover()) {
      if (panel.matches(":popover-open")) {
        panel.hidePopover();
      }
    } else {
      panel.removeAttribute("data-popover-open");
      setAccountOpen(false);
    }
  }, [hasNativePopover]);

  // Measure the inline navigation bar without hardcoded breakpoints.
  const syncResponsiveLayout = useCallback((force = false) => {
    const header = headerRef.current;
    const inner = innerRef.current;
    const drawer = drawerRef.current;
    if (!header || !inner) return;

    const currentWidth = header.clientWidth;
    const previouslyWide = isWideRef.current;

    if (
      !force &&
      !previouslyWide &&
      currentWidth <= lastHeaderWidthRef.current
    ) {
      return;
    }
    lastHeaderWidthRef.current = currentWidth;

    let rafId = 0;
    header.classList.add("is-measuring");
    header.classList.add("is-wide");

    const fitsInline = inner.scrollWidth <= inner.clientWidth + 1;
    isWideRef.current = fitsInline;

    if (fitsInline) {
      if (drawer?.open) {
        drawer.close();
        setMenuOpen(false);
      }
    } else {
      header.classList.remove("is-wide");
    }

    rafId = window.requestAnimationFrame(() => {
      header.classList.remove("is-measuring");
    });

    return () => window.cancelAnimationFrame(rafId);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const header = headerRef.current;
    const menu = menuRef.current;
    if (!header || !menu) return;

    const cleanupInitial = syncResponsiveLayout(true);

    const observer = new ResizeObserver(() => {
      syncResponsiveLayout(false);
    });
    observer.observe(header);
    observer.observe(menu);

    return () => {
      cleanupInitial?.();
      observer.disconnect();
    };
  }, [syncResponsiveLayout]);

  // Re-evaluate layout whenever auth state changes link count or right-side action width.
  useIsomorphicLayoutEffect(() => {
    const cleanup = syncResponsiveLayout(true);
    return () => cleanup?.();
  }, [session?.user, links.length, syncResponsiveLayout]);

  // Native scroll-snap drawer state detection, Escape slide-out, light-dismiss, and backdrop fade fallback.
  useEffect(() => {
    const drawer = drawerRef.current;
    const scroller = drawerScrollerRef.current;
    const sheet = drawerSheetRef.current;
    if (!drawer || !scroller || !sheet) return;

    const visibleThreshold = 1 / Math.max(window.innerWidth, 320);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (!entry) return;
        if (entry.intersectionRatio >= visibleThreshold) {
          drawerVisibleRef.current = true;
          if (entry.intersectionRatio === 1) {
            setMenuOpen(true);
          }
        } else if (drawerVisibleRef.current) {
          drawerVisibleRef.current = false;
          if (drawer.open) {
            drawer.close();
          }
          setMenuOpen(false);
        }
      },
      { root: drawer, threshold: [visibleThreshold, 1] },
    );
    observer.observe(sheet);

    const handleCancel = (event: Event) => {
      if (event.cancelable) {
        event.preventDefault();
        closeMobileDrawer();
      }
    };

    const handleClose = () => {
      drawerVisibleRef.current = false;
      setMenuOpen(false);
    };

    const handleClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !sheet.contains(event.target)) {
        closeMobileDrawer();
      }
    };

    drawer.addEventListener("cancel", handleCancel);
    drawer.addEventListener("close", handleClose);
    drawer.addEventListener("click", handleClick);

    let removeScrollFallback: (() => void) | undefined;
    if (
      typeof CSS === "undefined" ||
      !CSS.supports("animation-timeline", "scroll()")
    ) {
      const handleScroll = () => {
        const sheetWidth = Math.max(1, sheet.offsetWidth);
        const ratio = Math.max(
          0,
          Math.min(1, scroller.scrollLeft / sheetWidth),
        );
        drawer.style.setProperty("--drawer-backdrop", String(ratio));
      };
      scroller.addEventListener("scroll", handleScroll, { passive: true });
      removeScrollFallback = () =>
        scroller.removeEventListener("scroll", handleScroll);
    }

    return () => {
      observer.disconnect();
      drawer.removeEventListener("cancel", handleCancel);
      drawer.removeEventListener("close", handleClose);
      drawer.removeEventListener("click", handleClick);
      removeScrollFallback?.();
    };
  }, [closeMobileDrawer]);

  // Progressive IntersectionObserver fallback for scroll-state sticky styling on browsers without scroll-state queries.
  useEffect(() => {
    const header = headerRef.current;
    const sentinel = sentinelRef.current;
    if (!header || !sentinel) return;
    if (
      typeof CSS !== "undefined" &&
      CSS.supports("container-type", "scroll-state")
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        header.classList.toggle("is-stuck", !entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Account popover toggle + anchor fallback positioning.
  useEffect(() => {
    const panel = accountPopoverRef.current;
    const trigger = accountTriggerRef.current;
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
  }, [session?.user]);

  // Manual Escape + outside-click fallback ONLY for account popover when native Popover API is unavailable.
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
        !accountTriggerRef.current?.contains(target) &&
        !accountPopoverRef.current?.contains(target)
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
  }, [accountOpen, hasNativePopover, closeAccountPanel]);

  async function handleSignOut() {
    closeMobileDrawer();
    closeAccountPanel();
    await authClient.signOut();
    router.refresh();
  }

  const userName = session?.user?.name || "Portal account";
  const userEmail = session?.user?.email || "";
  const initials = getInitials(session?.user?.name, session?.user?.email);

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="pointer-events-none -mb-px h-px w-full"
      />
      <header ref={headerRef} className="site-header">
        <div className="site-header-bar">
          <div ref={innerRef} className="site-header-inner">
            <Link
              href="/"
              aria-label="CEDA Innovation Portal home"
              onClick={closeMobileDrawer}
              className="group inline-flex items-center gap-3 rounded-lg py-1 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ceda-orange">
              <span className="relative block h-11 w-28 sm:w-32">
                <Image
                  src="/assets/ceda logo.png"
                  alt="CEDA — Citizen Entrepreneurial Development Agency"
                  fill
                  sizes="(max-width: 640px) 112px, 128px"
                  className="object-contain object-left"
                  priority
                />
              </span>
            </Link>

            <nav aria-label="Primary" className="flex items-center">
              <button
                type="button"
                className="site-menu-button"
                aria-controls={drawerId}
                aria-expanded={menuOpen}
                onClick={openMobileDrawer}>
                <Menu
                  aria-hidden="true"
                  className="h-4 w-4 text-ceda-burgundy"
                />
                <span>Menu</span>
              </button>

              <ul ref={menuRef} className="site-menu">
                {links.map((item) => (
                  <li key={item.href}>
                    <Suspense
                      fallback={
                        <NavigationLink
                          item={item}
                          onNavigate={closeMobileDrawer}
                        />
                      }>
                      <ActiveNavigationLink
                        item={item}
                        onNavigate={closeMobileDrawer}
                      />
                    </Suspense>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="site-header-actions">
              {session?.user ? (
                <>
                  <button
                    ref={accountTriggerRef}
                    type="button"
                    popoverTarget={accountPanelId}
                    popoverTargetAction="toggle"
                    aria-controls={accountPanelId}
                    aria-expanded={accountOpen}
                    onClick={() => {
                      if (!hasNativePopover() && accountPopoverRef.current) {
                        const nextOpen = !accountOpen;
                        if (nextOpen) {
                          accountPopoverRef.current.setAttribute(
                            "data-popover-open",
                            "true",
                          );
                          positionAccountFallback(
                            accountPopoverRef.current,
                            accountTriggerRef.current!,
                          );
                        } else {
                          accountPopoverRef.current.removeAttribute(
                            "data-popover-open",
                          );
                        }
                        setAccountOpen(nextOpen);
                      }
                    }}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-transparent py-1 pl-1.5 pr-3 text-sm font-medium text-ceda-ink transition hover:border-ceda-line hover:bg-ceda-cream focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-ceda-burgundy text-xs font-bold text-white">
                      {initials}
                    </span>
                    <span className="max-w-28 truncate">
                      {session.user.name || "Account"}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`h-4 w-4 text-ceda-muted transition-transform duration-150 ${
                        accountOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div
                    ref={accountPopoverRef}
                    id={accountPanelId}
                    popover="auto"
                    className="site-account-popover">
                    <div className="border-b border-ceda-line px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-ceda-ink">
                        {userName}
                      </p>
                      {userEmail ? (
                        <p className="mt-0.5 truncate text-xs text-ceda-muted">
                          {userEmail}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-1 grid gap-0.5">
                      <Link
                        href="/profile"
                        onClick={closeAccountPanel}
                        className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ceda-body transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                        <UserRound
                          aria-hidden="true"
                          className="h-4 w-4 text-ceda-muted"
                        />
                        <span>My profile</span>
                      </Link>
                      <Link
                        href="/notifications"
                        onClick={closeAccountPanel}
                        className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ceda-body transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                        <Bell
                          aria-hidden="true"
                          className="h-4 w-4 text-ceda-muted"
                        />
                        <span>Notifications</span>
                      </Link>
                      <Link
                        href="/account/settings"
                        onClick={closeAccountPanel}
                        className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ceda-body transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                        <Settings
                          aria-hidden="true"
                          className="h-4 w-4 text-ceda-muted"
                        />
                        <span>Account settings</span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="mt-1 flex min-h-10 w-full items-center gap-3 rounded-xl border-t border-ceda-line px-3 pt-1 text-left text-sm font-semibold text-ceda-burgundy transition hover:bg-ceda-cream focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                        <LogOut aria-hidden="true" className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex min-h-11 items-center rounded-full px-3.5 text-sm font-semibold text-ceda-ink transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-ceda-burgundy px-5 text-sm font-semibold text-white shadow-xs transition hover:bg-ceda-burgundy-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer: native modal <dialog> with scroll-snap swipe-to-dismiss */}
      <dialog
        ref={drawerRef}
        id={drawerId}
        aria-label="Site navigation"
        className="site-drawer">
        <div ref={drawerScrollerRef} className="site-drawer-scroller">
          <nav
            ref={drawerSheetRef}
            aria-label="Mobile navigation"
            className="site-drawer-sheet">
            {/* Drawer Header: CEDA Brand + Crisp Close Button */}
            <div className="flex min-h-18 shrink-0 items-center justify-between gap-3 border-b border-ceda-line bg-white px-5">
              <Link
                href="/"
                aria-label="CEDA Innovation Portal home"
                onClick={closeMobileDrawer}
                className="inline-flex items-center rounded-lg py-1 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ceda-orange">
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
                onClick={closeMobileDrawer}
                aria-label="Close navigation menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ceda-burgundy/15 bg-ceda-cream text-ceda-ink transition-colors hover:border-ceda-burgundy/35 hover:bg-ceda-cream-mid hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body: Structured Explore & Account Groups */}
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
                          <DrawerNavigationLink
                            item={item}
                            onNavigate={closeMobileDrawer}
                          />
                        }>
                        <ActiveDrawerNavigationLink
                          item={item}
                          onNavigate={closeMobileDrawer}
                        />
                      </Suspense>
                    </li>
                  ))}
                </ul>
              </div>

              {session?.user ? (
                <div className="border-t border-ceda-line pt-5">
                  <p className="mb-2.5 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ceda-muted">
                    Account
                  </p>

                  {/* Compact Identity Card */}
                  <div className="mb-3 flex items-center gap-3 rounded-xl border border-ceda-burgundy/10 bg-ceda-cream px-3 py-2.5">
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ceda-burgundy text-xs font-bold text-white">
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
                      onClick={closeMobileDrawer}
                      className="group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ceda-body transition-colors hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                      <UserRound
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-ceda-muted transition-colors group-hover:text-ceda-burgundy"
                      />
                      <span>My profile</span>
                    </Link>
                    <Link
                      href="/notifications"
                      onClick={closeMobileDrawer}
                      className="group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ceda-body transition-colors hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                      <Bell
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-ceda-muted transition-colors group-hover:text-ceda-burgundy"
                      />
                      <span>Notifications</span>
                    </Link>
                    <Link
                      href="/account/settings"
                      onClick={closeMobileDrawer}
                      className="group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ceda-body transition-colors hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
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

            {/* Anchored Drawer Footer: Auth / Sign Out Actions */}
            <div className="shrink-0 border-t border-ceda-line bg-[#FFFBF7] px-4 py-3.5">
              {session?.user ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-ceda-burgundy/18 bg-white px-4 text-sm font-semibold text-ceda-burgundy transition-colors hover:border-ceda-burgundy/35 hover:bg-[#FFF0E2] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                  <LogOut aria-hidden="true" className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              ) : (
                <div className="grid gap-2">
                  <Link
                    href="/signup"
                    onClick={closeMobileDrawer}
                    className="flex min-h-11 items-center justify-center rounded-full bg-ceda-burgundy px-4 text-sm font-semibold text-white transition-colors hover:bg-ceda-burgundy-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                    Register
                  </Link>
                  <Link
                    href="/login"
                    onClick={closeMobileDrawer}
                    className="flex min-h-11 items-center justify-center rounded-full border border-ceda-line bg-white px-4 text-sm font-semibold text-ceda-ink transition-colors hover:border-ceda-burgundy/40 hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </dialog>
    </>
  );
}
