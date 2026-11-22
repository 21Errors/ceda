import {
  BookOpen,
  CircleHelp,
  House,
  Info,
  Newspaper,
} from "lucide-react";
import type { ComponentType } from "react";

export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

export const PUBLIC_NAVIGATION: readonly NavItem[] = [
  { label: "Home", href: "/", icon: House },
  { label: "News", href: "/news", icon: Newspaper },
  { label: "Guidelines", href: "/guidelines", icon: BookOpen },
  { label: "About", href: "/about", icon: Info },
  { label: "FAQ", href: "/faq", icon: CircleHelp },
];

export function isCurrentPath(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function getInitials(name?: string | null, email?: string | null) {
  return (name || email || "U")
    .trim()
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function hasNativePopover() {
  return (
    typeof HTMLElement !== "undefined" &&
    Object.hasOwn(HTMLElement.prototype, "popover")
  );
}

export function positionAccountFallback(
  popover: HTMLElement,
  trigger: HTMLElement,
) {
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
