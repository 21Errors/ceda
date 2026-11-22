"use client";

import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpenCheck,
  ChevronRight,
  ClipboardCheck,
  Compass,
  ExternalLink,
  Eye,
  FileText,
  FolderPlus,
  GitPullRequestArrow,
  Headphones,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  Scale,
  ScrollText,
  Settings,
  Shield,
  Tags,
  Trophy,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { PortalRole } from "@/lib/authorization";
import { cn } from "@/lib/cn";
import {
  buildWorkspaceBreadcrumbs,
  getNavigationForRoles,
  isNavItemActive,
  ROLE_METADATA,
  type NavIconKey,
  type WorkspaceNavGroup,
} from "@/lib/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { GlobalSupportActions } from "@/components/GlobalSupportActions";

const NAV_ICONS: Record<NavIconKey, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  submit: PlusCircle,
  track: Compass,
  evaluator: ClipboardCheck,
  adjudicator: Scale,
  committee: Eye,
  consultant: Headphones,
  admin: Shield,
  calls: FolderPlus,
  users: Users,
  reviews: GitPullRequestArrow,
  awards: Trophy,
  categories: Tags,
  faqs: BookOpenCheck,
  documents: FileText,
  pages: Megaphone,
  reports: BarChart3,
  audit: ScrollText,
  notifications: Bell,
  profile: UserRound,
  settings: Settings,
};

export interface WorkspaceShellProps {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  roles: PortalRole[];
  unreadNotifications: number;
  sectionLabel?: string;
  children: ReactNode;
}

interface SidebarContentProps {
  groups: WorkspaceNavGroup[];
  pathname: string;
  collapsed: boolean;
  user: WorkspaceShellProps["user"];
  roles: PortalRole[];
  onNavigate?: () => void;
  onSignOut: () => void;
  signingOut: boolean;
  headerAction?: ReactNode;
}

function SidebarLinkPendingHint() {
  const { pending } = useLinkStatus();
  return <span aria-hidden="true" data-pending={pending ? "true" : undefined} className="ds-link-pending-dot" />;
}

function SidebarContent({
  groups,
  pathname,
  collapsed,
  user,
  roles,
  onNavigate,
  onSignOut,
  signingOut,
  headerAction,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand Header */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-ceda-line px-ds-4",
          collapsed ? "justify-center" : "justify-between gap-ds-2",
        )}
      >
        {!collapsed ? (
          <Link
            href="/"
            onClick={onNavigate}
            className="flex min-w-0 items-center gap-ds-2 rounded-control py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
            aria-label="CEDA Innovation Portal home"
          >
            <span className="relative block h-9 w-24 shrink-0">
              <Image
                src="/assets/ceda logo.png"
                alt="CEDA"
                fill
                sizes="96px"
                className="object-contain object-left"
                priority
              />
            </span>
            <span className="hidden truncate border-s border-ceda-line ps-ds-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-ceda-burgundy sm:inline">
              Portal
            </span>
          </Link>
        ) : null}
        {headerAction}
      </div>

      {/* RBAC Navigation Groups */}
      <nav aria-label="Workspace navigation" className="flex-1 overflow-y-auto px-ds-3 py-ds-4">
        <div className="flex flex-col gap-ds-6">
          {groups.map((group) => (
            <div key={group.id}>
              {!collapsed ? (
                <p className="mb-ds-2 px-ds-3 text-[11px] font-extrabold uppercase tracking-[0.15em] text-ceda-muted">
                  {group.label}
                </p>
              ) : (
                <div className="mx-auto mb-ds-2 h-px w-6 bg-ceda-line" aria-hidden="true" />
              )}

              <ul className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const Icon = NAV_ICONS[item.icon];
                  const active = isNavItemActive(pathname, item);

                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "ds-nav-item group flex min-h-10 items-center rounded-control text-sm transition-[background-color,color,border-color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange",
                          collapsed
                            ? "justify-center px-2 py-2.5"
                            : "gap-ds-3 px-ds-3 py-2",
                          active
                            ? "border border-ceda-line bg-white font-semibold text-ceda-burgundy shadow-xs"
                            : "border border-transparent font-medium text-ceda-body hover:bg-white/75 hover:text-ceda-ink",
                        )}
                      >
                        <Icon
                          aria-hidden="true"
                          className={cn(
                            "h-4.5 w-4.5 shrink-0 transition-colors",
                            active
                              ? "text-ceda-burgundy"
                              : "text-ceda-muted group-hover:text-ceda-burgundy",
                          )}
                        />
                        {!collapsed ? (
                          <>
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            <SidebarLinkPendingHint />
                            {item.badge ? (
                              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-ceda-burgundy px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white">
                                {item.badge}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <span className="sr-only">{item.label}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom User & Utility Footer */}
      <div className="shrink-0 border-t border-ceda-line bg-white/75 p-ds-3">
        {user ? (
          <div className="flex flex-col gap-ds-2">
            {!collapsed ? (
              <div className="rounded-control border border-ceda-line bg-white p-ds-3 shadow-xs">
                <div className="flex items-center gap-ds-3">
                  <Avatar name={user.name} size="sm" tone="burgundy" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-ceda-ink">{user.name}</p>
                    <p className="truncate text-[11px] text-ceda-muted">{user.email}</p>
                  </div>
                </div>
                {roles.length > 0 ? (
                  <div className="mt-ds-2 flex flex-wrap gap-1">
                    {roles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center rounded-full bg-ceda-cream-mid px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ceda-burgundy"
                      >
                        {ROLE_METADATA[role]?.shortLabel ?? role}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex justify-center py-1">
                <Avatar name={user.name} size="sm" tone="burgundy" />
              </div>
            )}

            <div className={cn("flex gap-1", collapsed ? "flex-col items-center" : "items-center")}>
              <Link
                href="/"
                onClick={onNavigate}
                title="Public portal"
                className={cn(
                  "inline-flex min-h-9 items-center justify-center gap-ds-2 rounded-control border border-ceda-line bg-white text-xs font-semibold text-ceda-body transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange",
                  collapsed ? "w-9 px-0" : "flex-1 px-ds-3",
                )}
              >
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                {!collapsed ? <span>Public site</span> : <span className="sr-only">Public site</span>}
              </Link>
              <button
                type="button"
                disabled={signingOut}
                onClick={onSignOut}
                title="Sign out"
                className={cn(
                  "inline-flex min-h-9 items-center justify-center gap-ds-2 rounded-control border border-ceda-line bg-white text-xs font-semibold text-ceda-burgundy transition hover:border-ceda-burgundy/35 hover:bg-ceda-cream disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange",
                  collapsed ? "w-9 px-0" : "px-ds-3",
                )}
              >
                <LogOut aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                {!collapsed ? <span>Sign out</span> : <span className="sr-only">Sign out</span>}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function WorkspaceShell({
  user,
  roles,
  unreadNotifications,
  sectionLabel,
  children,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const drawerId = useId();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const drawerRef = useRef<HTMLDialogElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const groups = getNavigationForRoles(roles, unreadNotifications);
  const breadcrumbs = buildWorkspaceBreadcrumbs(pathname);
  const resolvedSectionLabel =
    sectionLabel ??
    (pathname === "/profile" || pathname === "/notifications" || pathname.startsWith("/account")
      ? "Account"
      : pathname.startsWith("/admin")
        ? "Governance"
        : "Workspace");

  const isSubmitterOnly = roles.includes("submitter") && !roles.includes("admin") && !roles.includes("consultant");
  const primaryAction = roles.includes("admin")
    ? { label: "New Call", href: "/admin/calls/new" }
    : roles.includes("submitter")
      ? { label: "Submit Idea", href: "/submit" }
      : null;

  const openDrawer = useCallback(async () => {
    const dialog = drawerRef.current;
    const scroller = scrollerRef.current;
    if (!dialog || !scroller || dialog.open) return;

    dialog.showModal();

    if (typeof CSS === "undefined" || !CSS.supports("scroll-initial-target", "nearest")) {
      scroller.scrollTo({ left: scroller.offsetWidth, behavior: "instant" as ScrollBehavior });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    }

    scroller.scrollTo({ left: 0, behavior: "auto" });
  }, []);

  const closeDrawer = useCallback(() => {
    const dialog = drawerRef.current;
    const scroller = scrollerRef.current;
    if (!dialog?.open || !scroller) return;
    scroller.scrollTo({ left: scroller.offsetWidth, behavior: "auto" });
  }, []);

  // Sync native swipeable drawer state via IntersectionObserver + scroll backdrop fallback
  useEffect(() => {
    const dialog = drawerRef.current;
    const scroller = scrollerRef.current;
    const sheet = sheetRef.current;
    if (!dialog || !scroller || !sheet) return;

    const visibleThreshold = 1 / Math.max(window.innerWidth, 320);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (!entry) return;
        if (entry.intersectionRatio < visibleThreshold) {
          if (dialog.open) dialog.close();
          setDrawerOpen(false);
        } else if (entry.intersectionRatio >= 0.99) {
          setDrawerOpen(true);
        }
      },
      { root: dialog, threshold: [visibleThreshold, 1] },
    );

    observer.observe(sheet);

    const handleCancel = (event: Event) => {
      if (event.cancelable) {
        event.preventDefault();
        closeDrawer();
      }
    };

    const handleDialogClick = (event: MouseEvent) => {
      if (!sheet.contains(event.target as Node)) {
        closeDrawer();
      }
    };

    const handleClose = () => setDrawerOpen(false);

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("click", handleDialogClick);
    dialog.addEventListener("close", handleClose);

    let cleanupScroll: (() => void) | undefined;
    if (typeof CSS === "undefined" || !CSS.supports("animation-timeline: scroll()")) {
      const onScroll = () => {
        const width = sheet.offsetWidth || 1;
        const ratio = Math.max(0, Math.min(1, 1 - scroller.scrollLeft / width));
        dialog.style.setProperty("--drawer-backdrop", String(ratio));
      };
      scroller.addEventListener("scroll", onScroll, { passive: true });
      cleanupScroll = () => scroller.removeEventListener("scroll", onScroll);
    }

    return () => {
      observer.disconnect();
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("click", handleDialogClick);
      dialog.removeEventListener("close", handleClose);
      cleanupScroll?.();
    };
  }, [closeDrawer]);

  // Close mobile drawer automatically on route transitions
  useEffect(() => {
    const dialog = drawerRef.current;
    if (dialog?.open) {
      dialog.close();
    }
  }, [pathname]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F7F8F9]">
      {/* Desktop Persistent RBAC Sidebar */}
      <aside
        aria-label="Workspace sidebar"
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 border-e border-ceda-line bg-[#FCF8F5] transition-[width] duration-200 lg:block",
          collapsed ? "w-19" : "w-68",
        )}
      >
        <SidebarContent
          groups={groups}
          pathname={pathname}
          collapsed={collapsed}
          user={user}
          roles={roles}
          onSignOut={() => void handleSignOut()}
          signingOut={signingOut}
          headerAction={
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-ceda-muted transition hover:bg-white hover:text-ceda-burgundy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
            >
              {collapsed ? (
                <PanelLeftOpen aria-hidden="true" className="h-4.5 w-4.5" />
              ) : (
                <PanelLeftClose aria-hidden="true" className="h-4.5 w-4.5" />
              )}
            </button>
          }
        />
      </aside>

      {/* Mobile Swipeable Native <dialog> Navigation Drawer */}
      <dialog
        ref={drawerRef}
        id={drawerId}
        aria-label="Workspace navigation drawer"
        className="ds-drawer lg:hidden"
      >
        <div ref={scrollerRef} className="ds-drawer-scroller">
          <div ref={sheetRef} className="ds-drawer-sheet">
            <SidebarContent
              groups={groups}
              pathname={pathname}
              collapsed={false}
              user={user}
              roles={roles}
              onNavigate={closeDrawer}
              onSignOut={() => void handleSignOut()}
              signingOut={signingOut}
              headerAction={
                <button
                  type="button"
                  autoFocus
                  onClick={closeDrawer}
                  aria-label="Close navigation drawer"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-ceda-body transition hover:bg-ceda-cream-mid hover:text-ceda-burgundy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              }
            />
          </div>
        </div>
      </dialog>

      {/* Main SaaS Workspace Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky Workspace Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-ds-3 border-b border-ceda-line bg-white/92 px-gutter backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-ds-3">
            <button
              type="button"
              onClick={() => void openDrawer()}
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              aria-controls={drawerId}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-ceda-line bg-white text-ceda-ink transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange lg:hidden"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>

            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
              <span className="hidden text-xs font-bold uppercase tracking-[0.14em] text-ceda-muted sm:inline">
                {resolvedSectionLabel}
              </span>
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <span key={crumb.href} className="flex min-w-0 items-center gap-1.5">
                    <ChevronRight
                      aria-hidden="true"
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 text-ceda-muted/70",
                        index === 0 && "hidden sm:block",
                      )}
                    />
                    {isLast ? (
                      <span className="truncate font-bold text-ceda-ink">{crumb.label}</span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="truncate font-medium text-ceda-muted transition hover:text-ceda-burgundy focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                );
              })}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex shrink-0 items-center gap-ds-2">
            {primaryAction ? (
              <Link
                href={primaryAction.href}
                className="hidden min-h-9 items-center gap-ds-2 rounded-full bg-ceda-burgundy px-ds-4 text-xs font-bold text-white shadow-xs transition hover:bg-ceda-burgundy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange sm:inline-flex"
              >
                <PlusCircle aria-hidden="true" className="h-3.5 w-3.5" />
                <span>{primaryAction.label}</span>
              </Link>
            ) : null}

            <Link
              href="/notifications"
              aria-label={
                unreadNotifications > 0
                  ? `Notifications (${unreadNotifications} unread)`
                  : "Notifications"
              }
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-ceda-line bg-white text-ceda-body transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
            >
              <Bell aria-hidden="true" className="h-4.5 w-4.5" />
              {unreadNotifications > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-ceda-orange ring-2 ring-white"
                />
              ) : null}
            </Link>

            {user ? (
              <Link
                href="/profile"
                aria-label="Open profile"
                className="inline-flex items-center gap-ds-2 rounded-full border border-ceda-line bg-white py-1 pe-ds-3 ps-1 text-xs font-semibold text-ceda-ink transition hover:bg-ceda-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
              >
                <Avatar name={user.name} size="sm" tone="burgundy" className="h-7 w-7 text-[11px]" />
                <span className="hidden max-w-28 truncate md:inline">{user.name}</span>
              </Link>
            ) : null}
          </div>
        </header>

        {/* Workspace Page Content */}
        <div className="flex flex-1 flex-col">{children}</div>
      </div>

      {/* Show floating support consultant actions for applicants, keep staff dashboards uncluttered */}
      {isSubmitterOnly ? <GlobalSupportActions /> : null}
    </div>
  );
}
