"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { isCurrentPath, type NavItem } from "./nav-items";

export function NavigationLink({
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

export function ActiveNavigationLink({
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

export function DrawerNavigationLink({
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
      }`}
    >
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

export function ActiveDrawerNavigationLink({
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
