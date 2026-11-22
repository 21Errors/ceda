"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { PortalRole } from "@/lib/authorization";
import { cn } from "@/lib/cn";
import { buildWorkspaceBreadcrumbs, getNavigationForRoles } from "@/lib/navigation";
import { GlobalSupportActions } from "@/components/GlobalSupportActions";
import { useNotificationsModal } from "@/components/notifications/NotificationsModalContext";
import { WorkspaceSidebar, type WorkspaceUserSummary } from "./WorkspaceSidebar";
import { WorkspaceTopBar } from "./WorkspaceTopBar";
import { useSwipeDrawer } from "./useSwipeDrawer";

export interface WorkspaceShellProps {
  user: WorkspaceUserSummary | null;
  roles: PortalRole[];
  unreadNotifications: number;
  sectionLabel?: string;
  children: ReactNode;
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
  const [signingOut, setSigningOut] = useState(false);

  const { drawerRef, scrollerRef, sheetRef, drawerOpen, openDrawer, closeDrawer } =
    useSwipeDrawer(pathname);
  const { openNotifications, unreadCount: liveUnreadCount } =
    useNotificationsModal();
  const effectiveUnreadCount = liveUnreadCount ?? unreadNotifications;

  const groups = getNavigationForRoles(roles);
  const breadcrumbs = buildWorkspaceBreadcrumbs(pathname);
  const resolvedSectionLabel =
    sectionLabel ??
    (pathname === "/profile" || pathname === "/notifications" || pathname.startsWith("/account")
      ? "Account"
      : pathname.startsWith("/admin")
        ? "Admin Portal"
        : "Workspace");

  const isSubmitterOnly =
    roles.includes("submitter") && !roles.includes("admin") && !roles.includes("consultant");
  const primaryAction = roles.includes("admin")
    ? { label: "New Call", href: "/admin/calls/new" }
    : roles.includes("submitter")
      ? { label: "Submit Idea", href: "/submit" }
      : null;

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
        <WorkspaceSidebar
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
            <WorkspaceSidebar
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
        <WorkspaceTopBar
          drawerId={drawerId}
          drawerOpen={drawerOpen}
          onOpenDrawer={() => void openDrawer()}
          onOpenNotifications={openNotifications}
          sectionLabel={resolvedSectionLabel}
          breadcrumbs={breadcrumbs}
          primaryAction={primaryAction}
          unreadNotifications={effectiveUnreadCount}
          user={user}
        />

        <div className="flex flex-1 flex-col">{children}</div>
      </div>

      {isSubmitterOnly ? <GlobalSupportActions /> : null}
    </div>
  );
}
