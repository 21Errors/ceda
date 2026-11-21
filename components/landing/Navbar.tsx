"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
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
} from "react";
import { authClient } from "@/lib/auth-client";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface NavItem {
  readonly label: string;
  readonly href: string;
}

const PUBLIC_NAVIGATION: readonly NavItem[] = [
  { label: "Home", href: "/" },
  { label: "News", href: "/news" },
  { label: "Guidelines", href: "/guidelines" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
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
  if (typeof CSS !== "undefined" && CSS.supports("position-area", "block-end")) {
    return;
  }

  const triggerRect = trigger.getBoundingClientRect();
  const panelRect = popover.getBoundingClientRect();
  const margin = 12;

  let left = triggerRect.right - panelRect.width;
  left = Math.max(margin, Math.min(left, window.innerWidth - panelRect.width - margin));

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
      className="site-nav-link"
    >
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

export function Navbar() {
  const menuId = "primary-site-menu";
  const accountPanelId = useId();
  const headerRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const accountPopoverRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const lastHeaderWidthRef = useRef(0);
  const isWideRef = useRef(false);

  const { data: session } = authClient.useSession();
  const router = useRouter();

  const links: readonly NavItem[] = session?.user
    ? [
        PUBLIC_NAVIGATION[0],
        { label: "Dashboard", href: "/dashboard" },
        ...PUBLIC_NAVIGATION.slice(1),
      ]
    : PUBLIC_NAVIGATION;

  const hasNativePopover = useCallback(
    () =>
      typeof HTMLElement !== "undefined" &&
      Object.hasOwn(HTMLElement.prototype, "popover"),
    [],
  );

  const closeMobileMenu = useCallback(() => {
    const menu = menuRef.current;
    if (!menu) return;
    if (hasNativePopover()) {
      if (menu.matches(":popover-open")) {
        menu.hidePopover();
      }
    } else {
      menu.removeAttribute("data-popover-open");
      setMenuOpen(false);
    }
  }, [hasNativePopover]);

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

  // Measure the single semantic navigation tree without hardcoded breakpoints.
  const syncResponsiveLayout = useCallback(
    (force = false) => {
      const header = headerRef.current;
      const inner = innerRef.current;
      const menu = menuRef.current;
      if (!header || !inner || !menu) return;

      const currentWidth = header.clientWidth;
      const previouslyWide = isWideRef.current;

      // Avoid layout thrash: while collapsed, only remeasure when width grows or forced.
      if (!force && !previouslyWide && currentWidth <= lastHeaderWidthRef.current) {
        return;
      }
      lastHeaderWidthRef.current = currentWidth;

      const nativePopover = hasNativePopover();
      const wasMenuOpen = nativePopover
        ? menu.matches(":popover-open")
        : menu.getAttribute("data-popover-open") === "true";

      let rafId = 0;
      header.classList.add("is-measuring");

      // Temporarily show inline layout to measure true natural row width.
      if (nativePopover) {
        menu.removeAttribute("popover");
      }
      header.classList.add("is-wide");

      const fitsInline = inner.scrollWidth <= inner.clientWidth + 1;
      isWideRef.current = fitsInline;

      if (fitsInline) {
        menu.removeAttribute("data-popover-open");
        if (wasMenuOpen) {
          setMenuOpen(false);
        }
      } else {
        header.classList.remove("is-wide");
        if (nativePopover) {
          menu.setAttribute("popover", "auto");
          if (wasMenuOpen) {
            try {
              menu.showPopover();
            } catch {
              // Ignore if top-layer promotion is unavailable during teardown.
            }
          }
        } else if (wasMenuOpen) {
          menu.setAttribute("data-popover-open", "true");
        }
      }

      rafId = window.requestAnimationFrame(() => {
        header.classList.remove("is-measuring");
      });

      return () => window.cancelAnimationFrame(rafId);
    },
    [hasNativePopover],
  );

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

    const onToggle = (event: Event) => {
      const toggleEvent = event as ToggleEvent;
      setMenuOpen(toggleEvent.newState === "open");
    };
    menu.addEventListener("toggle", onToggle);

    return () => {
      cleanupInitial?.();
      observer.disconnect();
      menu.removeEventListener("toggle", onToggle);
    };
  }, [syncResponsiveLayout]);

  // Re-evaluate layout whenever auth state changes link count or right-side action width.
  useIsomorphicLayoutEffect(() => {
    const cleanup = syncResponsiveLayout(true);
    return () => cleanup?.();
  }, [session?.user, links.length, syncResponsiveLayout]);

  // Progressive IntersectionObserver fallback for scroll-state sticky styling on browsers without scroll-state queries.
  useEffect(() => {
    const header = headerRef.current;
    const sentinel = sentinelRef.current;
    if (!header || !sentinel) return;
    if (typeof CSS !== "undefined" && CSS.supports("container-type", "scroll-state")) {
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

  // Manual Escape + outside-click fallback ONLY when native Popover API is unavailable.
  useEffect(() => {
    if (hasNativePopover() || (!menuOpen && !accountOpen)) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileMenu();
        closeAccountPanel();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        !headerRef.current?.contains(target) &&
        !accountPopoverRef.current?.contains(target)
      ) {
        closeMobileMenu();
        closeAccountPanel();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen, accountOpen, hasNativePopover, closeMobileMenu, closeAccountPanel]);

  async function handleSignOut() {
    closeMobileMenu();
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
              onClick={closeMobileMenu}
              className="group inline-flex items-center gap-3 rounded-lg py-1 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ceda-orange"
            >
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
              <span className="hidden text-sm font-semibold tracking-tight text-ceda-ink/85 transition-colors group-hover:text-ceda-burgundy sm:inline">
                Innovation Portal
              </span>
            </Link>

            <nav aria-label="Primary" className="flex items-center">
              <button
                type="button"
                className="site-menu-button"
                popoverTarget={menuId}
                popoverTargetAction="toggle"
                aria-controls={menuId}
                aria-expanded={menuOpen}
                onClick={() => {
                  if (!hasNativePopover() && menuRef.current) {
                    const nextOpen = !menuOpen;
                    if (nextOpen) {
                      menuRef.current.setAttribute("data-popover-open", "true");
                    } else {
                      menuRef.current.removeAttribute("data-popover-open");
                    }
                    setMenuOpen(nextOpen);
                  }
                }}
              >
                {menuOpen ? (
                  <X aria-hidden="true" className="h-4 w-4 text-ceda-burgundy" />
                ) : (
                  <Menu aria-hidden="true" className="h-4 w-4 text-ceda-burgundy" />
                )}
                <span>{menuOpen ? "Close" : "Menu"}</span>
              </button>

              <ul
                ref={menuRef}
                id={menuId}
                className="site-menu"
                popover="auto"
              >
                {links.map((item) => (
                  <li key={item.href}>
                    <Suspense
                      fallback={
                        <NavigationLink item={item} onNavigate={closeMobileMenu} />
                      }
                    >
                      <ActiveNavigationLink
                        item={item}
                        onNavigate={closeMobileMenu}
                      />
                    </Suspense>
                  </li>
                ))}

                {!session?.user ? (
                  <li className="site-menu-mobile-only mt-2 border-t border-ceda-line pt-2.5">
                    <div className="grid gap-1.5">
                      <Link
                        href="/login"
                        onClick={closeMobileMenu}
                        className="flex min-h-11 items-center justify-center rounded-full border border-ceda-line bg-white px-4 text-sm font-semibold text-ceda-ink transition hover:border-ceda-burgundy/40 hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/signup"
                        onClick={closeMobileMenu}
                        className="flex min-h-11 items-center justify-center rounded-full bg-ceda-burgundy px-4 text-sm font-semibold text-white transition hover:bg-ceda-burgundy-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                      >
                        Register
                      </Link>
                    </div>
                  </li>
                ) : (
                  <li className="site-menu-mobile-only mt-2 border-t border-ceda-line pt-2.5">
                    <div className="mb-1.5 rounded-xl bg-ceda-cream px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-ceda-ink">
                        {userName}
                      </p>
                      {userEmail ? (
                        <p className="truncate text-xs text-ceda-muted">
                          {userEmail}
                        </p>
                      ) : null}
                    </div>
                    <div className="grid gap-0.5">
                      <Link
                        href="/profile"
                        onClick={closeMobileMenu}
                        className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ceda-body transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                      >
                        <UserRound aria-hidden="true" className="h-4 w-4 text-ceda-muted" />
                        <span>My profile</span>
                      </Link>
                      <Link
                        href="/notifications"
                        onClick={closeMobileMenu}
                        className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ceda-body transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                      >
                        <Bell aria-hidden="true" className="h-4 w-4 text-ceda-muted" />
                        <span>Notifications</span>
                      </Link>
                      <Link
                        href="/account/settings"
                        onClick={closeMobileMenu}
                        className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ceda-body transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                      >
                        <Settings aria-hidden="true" className="h-4 w-4 text-ceda-muted" />
                        <span>Account settings</span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-ceda-burgundy transition hover:bg-ceda-cream focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                      >
                        <LogOut aria-hidden="true" className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </li>
                )}
              </ul>
            </nav>

            <div className="site-header-actions">
              {session?.user ? (
                <>
                  <Link
                    href="/submit"
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-ceda-burgundy/25 bg-ceda-cream px-4 text-sm font-semibold text-ceda-burgundy transition hover:border-ceda-burgundy/50 hover:bg-ceda-cream-mid focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                  >
                    Submit an idea
                  </Link>

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
                          accountPopoverRef.current.setAttribute("data-popover-open", "true");
                          positionAccountFallback(
                            accountPopoverRef.current,
                            accountTriggerRef.current!,
                          );
                        } else {
                          accountPopoverRef.current.removeAttribute("data-popover-open");
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
                    <span className="max-w-28 truncate">{session.user.name || "Account"}</span>
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
                    className="site-account-popover"
                  >
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
                        className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ceda-body transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                      >
                        <UserRound aria-hidden="true" className="h-4 w-4 text-ceda-muted" />
                        <span>My profile</span>
                      </Link>
                      <Link
                        href="/notifications"
                        onClick={closeAccountPanel}
                        className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ceda-body transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                      >
                        <Bell aria-hidden="true" className="h-4 w-4 text-ceda-muted" />
                        <span>Notifications</span>
                      </Link>
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
                        onClick={handleSignOut}
                        className="mt-1 flex min-h-10 w-full items-center gap-3 rounded-xl border-t border-ceda-line px-3 pt-1 text-left text-sm font-semibold text-ceda-burgundy transition hover:bg-ceda-cream focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                      >
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
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
