"use client";

import Link from "next/link";
import { Bell, ChevronRight, Menu, PlusCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { BreadcrumbCrumb } from "@/lib/navigation";
import { Avatar } from "@/components/ui/Avatar";
import type { WorkspaceUserSummary } from "./WorkspaceSidebar";

interface WorkspaceTopBarProps {
  drawerId: string;
  drawerOpen: boolean;
  onOpenDrawer: () => void;
  onOpenNotifications: () => void;
  sectionLabel: string;
  breadcrumbs: BreadcrumbCrumb[];
  primaryAction: { label: string; href: string } | null;
  unreadNotifications: number;
  user: WorkspaceUserSummary | null;
}

export function WorkspaceTopBar({
  drawerId,
  drawerOpen,
  onOpenDrawer,
  onOpenNotifications,
  sectionLabel,
  breadcrumbs,
  primaryAction,
  unreadNotifications,
  user,
}: WorkspaceTopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-ds-3 border-b border-ceda-line bg-white/92 px-gutter backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-ds-3">
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
          aria-controls={drawerId}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-ceda-line bg-white text-ceda-ink transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange lg:hidden"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="hidden text-xs font-bold uppercase tracking-[0.14em] text-ceda-muted sm:inline">
            {sectionLabel}
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

        <button
          type="button"
          onClick={onOpenNotifications}
          aria-haspopup="dialog"
          aria-label={
            unreadNotifications > 0
              ? `Open notifications (${unreadNotifications} unread)`
              : "Open notifications"
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
        </button>

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
  );
}
