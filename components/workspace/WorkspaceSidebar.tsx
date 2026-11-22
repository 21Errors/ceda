"use client";

import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  BookOpenCheck,
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
  PlusCircle,
  Scale,
  ScrollText,
  Settings,
  Shield,
  Tags,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import type { PortalRole } from "@/lib/authorization";
import { cn } from "@/lib/cn";
import {
  isNavItemActive,
  ROLE_METADATA,
  type NavIconKey,
  type WorkspaceNavGroup,
} from "@/lib/navigation";
import { Avatar } from "@/components/ui/Avatar";

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
  profile: UserRound,
  settings: Settings,
};

export interface WorkspaceUserSummary {
  id: string;
  name: string;
  email: string;
}

export interface WorkspaceSidebarProps {
  groups: WorkspaceNavGroup[];
  pathname: string;
  collapsed: boolean;
  user: WorkspaceUserSummary | null;
  roles: PortalRole[];
  onNavigate?: () => void;
  onSignOut: () => void;
  signingOut: boolean;
  headerAction?: ReactNode;
}

function SidebarLinkPendingHint() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      data-pending={pending ? "true" : undefined}
      className="ds-link-pending-dot"
    />
  );
}

export function WorkspaceSidebar({
  groups,
  pathname,
  collapsed,
  user,
  roles,
  onNavigate,
  onSignOut,
  signingOut,
  headerAction,
}: WorkspaceSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand Header */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-ceda-line px-ds-4",
          collapsed ? "justify-center" : "justify-between gap-ds-2",
        )}>
        {!collapsed ? (
          <Link
            href="/"
            onClick={onNavigate}
            className="flex min-w-0 items-center gap-ds-2 rounded-control py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
            aria-label="CEDA Innovation Portal home">
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
          </Link>
        ) : null}
        {headerAction}
      </div>

      {/* RBAC Navigation Groups */}
      <nav
        aria-label="Workspace navigation"
        className="flex-1 overflow-y-auto overscroll-contain px-ds-3 py-ds-4 [scrollbar-color:rgba(122,31,20,0.2)_transparent] scrollbar-gutter-stable scrollbar-thin">
        <div className="flex flex-col gap-ds-4">
          {groups.map((group, index) => (
            <div
              key={group.id}
              className={cn(
                !collapsed &&
                  index > 0 &&
                  "border-t border-ceda-line/60 pt-ds-4",
              )}>
              {!collapsed ? (
                <p className="mb-ds-2 px-ds-3 text-[11px] font-extrabold uppercase tracking-[0.15em] text-ceda-muted">
                  {group.label}
                </p>
              ) : (
                <div
                  className="mx-auto mb-ds-2 h-px w-6 bg-ceda-line"
                  aria-hidden="true"
                />
              )}

              <ul className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const Icon = NAV_ICONS[item.icon];
                  const active = isNavItemActive(pathname, item);
                  const itemClasses = cn(
                    "ds-nav-item group flex min-h-10 w-full items-center rounded-control text-left text-sm transition-[background-color,color,border-color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange",
                    collapsed
                      ? "justify-center px-2 py-2.5"
                      : "gap-ds-3 px-ds-3 py-2",
                    active
                      ? "border border-ceda-line bg-white font-semibold text-ceda-burgundy shadow-xs"
                      : "border border-transparent font-medium text-ceda-body hover:bg-white/75 hover:text-ceda-ink",
                  );

                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? item.label : undefined}
                        className={itemClasses}
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
                            <span className="min-w-0 flex-1 truncate">
                              {item.label}
                            </span>
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
                    <p className="truncate text-xs font-bold text-ceda-ink">
                      {user.name}
                    </p>
                    <p className="truncate text-[11px] text-ceda-muted">
                      {user.email}
                    </p>
                  </div>
                </div>
                {roles.length > 0 ? (
                  <div className="mt-ds-2 flex flex-wrap gap-1">
                    {roles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center rounded-full bg-ceda-cream-mid px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ceda-burgundy">
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

            <div
              className={cn(
                "flex gap-1",
                collapsed ? "flex-col items-center" : "items-center",
              )}>
              <Link
                href="/"
                onClick={onNavigate}
                title="Public portal"
                className={cn(
                  "inline-flex min-h-9 items-center justify-center gap-ds-2 rounded-control border border-ceda-line bg-white text-xs font-semibold text-ceda-body transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange",
                  collapsed ? "w-9 px-0" : "flex-1 px-ds-3",
                )}>
                <ExternalLink
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0"
                />
                {!collapsed ? (
                  <span>Public site</span>
                ) : (
                  <span className="sr-only">Public site</span>
                )}
              </Link>
              <button
                type="button"
                disabled={signingOut}
                onClick={onSignOut}
                title="Sign out"
                className={cn(
                  "inline-flex min-h-9 items-center justify-center gap-ds-2 rounded-control border border-ceda-line bg-white text-xs font-semibold text-ceda-burgundy transition hover:border-ceda-burgundy/35 hover:bg-ceda-cream disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange",
                  collapsed ? "w-9 px-0" : "px-ds-3",
                )}>
                <LogOut aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                {!collapsed ? (
                  <span>Sign out</span>
                ) : (
                  <span className="sr-only">Sign out</span>
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
