"use client";

import Link from "next/link";
import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

const emptySubscribe = () => () => {};

function useHasNativeFocusgroup(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => typeof HTMLElement !== "undefined" && "focusGroup" in HTMLElement.prototype,
    () => false,
  );
}

function useHasNativeInvokers(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => typeof HTMLButtonElement !== "undefined" && "commandForElement" in HTMLButtonElement.prototype,
    () => false,
  );
}

export interface DropdownCommandItem {
  type?: "command";
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  tone?: "default" | "danger";
  disabled?: boolean;
  onSelect: () => void;
}

export interface DropdownLinkItem {
  type: "link";
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  external?: boolean;
  disabled?: boolean;
}

export interface DropdownCheckboxItem {
  type: "checkbox";
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (nextChecked: boolean) => void;
}

export interface DropdownRadioGroupItem {
  type: "radio-group";
  id: string;
  label: string;
  value: string;
  options: readonly {
    value: string;
    label: string;
    disabled?: boolean;
  }[];
  onValueChange: (nextValue: string) => void;
}

export interface DropdownSubmenuItem {
  type: "submenu";
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  items: readonly DropdownMenuItem[];
}

export interface DropdownSeparatorItem {
  type: "separator";
  id: string;
}

export type DropdownMenuItem =
  | DropdownCommandItem
  | DropdownLinkItem
  | DropdownCheckboxItem
  | DropdownRadioGroupItem
  | DropdownSubmenuItem
  | DropdownSeparatorItem;

export interface DropdownMenuProps {
  label: string;
  triggerIcon?: ReactNode;
  hideChevron?: boolean;
  ariaLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "icon";
  align?: "start" | "end";
  items: readonly DropdownMenuItem[];
  className?: string;
}

const triggerVariantClasses = {
  primary:
    "min-h-11 rounded-full bg-ceda-burgundy px-ds-5 text-sm font-bold text-white shadow-xs hover:bg-ceda-burgundy-dark",
  secondary:
    "min-h-11 rounded-full border border-ceda-line bg-white px-ds-5 text-sm font-bold text-ceda-ink shadow-xs hover:border-ceda-burgundy/40 hover:bg-ceda-cream hover:text-ceda-burgundy",
  ghost:
    "min-h-10 rounded-full px-ds-4 text-sm font-semibold text-ceda-body hover:bg-ceda-cream hover:text-ceda-burgundy",
  icon: "h-10 w-10 rounded-full border border-ceda-line bg-white p-0 text-ceda-body shadow-xs hover:border-ceda-burgundy/40 hover:bg-ceda-cream hover:text-ceda-burgundy",
};

function getOwnFocusableItems(group: HTMLElement): HTMLElement[] {
  return Array.from(group.querySelectorAll<HTMLElement>("button.ds-menu-item, a.ds-menu-item"))
    .filter((item) => item.closest("[focusgroup]") === group)
    .filter((item) => {
      if (item instanceof HTMLButtonElement && item.disabled) return false;
      return item.getAttribute("aria-disabled") !== "true";
    });
}

function positionPopoverFallback(
  popover: HTMLElement,
  trigger: HTMLElement,
  isSubmenu: boolean,
  align: "start" | "end",
) {
  if (typeof CSS !== "undefined" && CSS.supports("position-area", "block-end")) return;

  const triggerRect = trigger.getBoundingClientRect();
  const menuRect = popover.getBoundingClientRect();
  const margin = 8;

  let left: number;
  let top: number;

  if (isSubmenu) {
    left = triggerRect.right + 4;
    if (left + menuRect.width > window.innerWidth - margin) {
      left = triggerRect.left - menuRect.width - 4;
    }
    top = triggerRect.top;
    if (top + menuRect.height > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - menuRect.height - margin);
    }
    if (left < margin) {
      left = Math.min(window.innerWidth - menuRect.width - margin, triggerRect.left + 16);
      top = Math.min(window.innerHeight - menuRect.height - margin, triggerRect.bottom + 4);
    }
  } else {
    left = align === "end" ? triggerRect.right - menuRect.width : triggerRect.left;
    left = Math.max(margin, Math.min(left, window.innerWidth - menuRect.width - margin));
    top = triggerRect.bottom + 6;
    if (top + menuRect.height > window.innerHeight - margin) {
      const above = triggerRect.top - menuRect.height - 6;
      if (above >= margin) top = above;
    }
  }

  popover.style.left = `${Math.round(left)}px`;
  popover.style.top = `${Math.round(top)}px`;
}

function showPopoverWithSource(popover: HTMLElement, source: HTMLElement) {
  const fn = popover.showPopover as ((options?: { source?: HTMLElement }) => void) | undefined;
  if (!fn) return;
  try {
    fn.call(popover, { source });
  } catch {
    popover.showPopover();
  }
}

function focusWithoutRing(element: HTMLElement | null) {
  if (!element) return;
  try {
    (element as HTMLElement & { focus: (opts?: { focusVisible?: boolean; preventScroll?: boolean }) => void }).focus({
      focusVisible: false,
      preventScroll: true,
    });
  } catch {
    element.focus({ preventScroll: true });
  }
}

interface SubmenuNodeProps {
  item: DropdownSubmenuItem;
  rootClose: (fromPointer: boolean) => void;
  hasNativeFocusgroup: boolean;
  hasNativeInvokers: boolean;
}

function SubmenuNode({
  item,
  rootClose,
  hasNativeFocusgroup,
  hasNativeInvokers,
}: SubmenuNodeProps) {
  const triggerId = useId();
  const submenuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const enterOnOpenRef = useRef(false);
  const hoverTimerRef = useRef<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const openSubmenu = useCallback((enterFirst: boolean) => {
    const popover = popoverRef.current;
    const trigger = triggerRef.current;
    if (!popover || !trigger) return;
    enterOnOpenRef.current = enterFirst;
    if (!popover.matches(":popover-open")) {
      showPopoverWithSource(popover, trigger);
    } else if (enterFirst && groupRef.current) {
      getOwnFocusableItems(groupRef.current)[0]?.focus({ preventScroll: true });
    }
  }, []);

  const closeSubmenu = useCallback((restoreTrigger: boolean, fromPointer = false) => {
    const popover = popoverRef.current;
    const trigger = triggerRef.current;
    if (restoreTrigger && trigger) {
      if (fromPointer) focusWithoutRing(trigger);
      else trigger.focus({ preventScroll: true });
    }
    if (popover?.matches(":popover-open")) {
      popover.hidePopover();
    }
  }, []);

  useEffect(() => {
    const popover = popoverRef.current;
    const trigger = triggerRef.current;
    const group = groupRef.current;
    if (!popover || !trigger || !group) return;

    const handleToggle = (event: Event) => {
      const toggleEvent = event as ToggleEvent;
      const nextOpen = toggleEvent.newState === "open";
      setExpanded(nextOpen);
      if (nextOpen) {
        positionPopoverFallback(popover, trigger, true, "start");
        if (enterOnOpenRef.current) {
          enterOnOpenRef.current = false;
          getOwnFocusableItems(group)[0]?.focus({ preventScroll: true });
        }
      } else {
        popover.removeAttribute("data-bridge");
      }
    };

    popover.addEventListener("toggle", handleToggle);
    return () => {
      popover.removeEventListener("toggle", handleToggle);
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const startSafeTriangle = (event: PointerEvent<HTMLButtonElement>) => {
    const submenu = popoverRef.current;
    if (!submenu || !submenu.matches(":popover-open")) return;
    if (!window.matchMedia("(hover: hover)").matches) return;

    const rect = submenu.getBoundingClientRect();
    const isLeft = event.clientX < rect.left;
    if (!isLeft && event.clientX <= rect.right) return;

    submenu.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
    submenu.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
    submenu.setAttribute("data-bridge", "");

    let lastX = event.clientX;
    let timer = window.setTimeout(stop, 300);

    function stop() {
      window.clearTimeout(timer);
      submenu?.removeEventListener("pointermove", extend);
      submenu?.removeAttribute("data-bridge");
    }

    function extend(moveEvent: globalThis.PointerEvent) {
      if (moveEvent.target !== submenu || (isLeft ? moveEvent.clientX < lastX : moveEvent.clientX > lastX)) {
        stop();
        return;
      }
      lastX = moveEvent.clientX;
      window.clearTimeout(timer);
      timer = window.setTimeout(stop, 300);
    }

    submenu.addEventListener("pointermove", extend);
    submenu.addEventListener("toggle", stop, { once: true });
  };

  const handleSubmenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" || event.key === "ArrowLeft") {
      event.preventDefault();
      event.stopPropagation();
      closeSubmenu(true, false);
      return;
    }

    if (!hasNativeFocusgroup && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      const group = groupRef.current;
      if (!group) return;
      const items = getOwnFocusableItems(group);
      const current = items.indexOf(document.activeElement as HTMLElement);
      if (current < 0 || items.length === 0) return;
      event.preventDefault();
      event.stopPropagation();
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? items.length - 1
            : (current + (event.key === "ArrowUp" ? -1 : 1) + items.length) % items.length;
      items[next]?.focus({ preventScroll: true });
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={item.disabled}
        role={hasNativeFocusgroup ? undefined : "menuitem"}
        aria-haspopup="menu"
        aria-expanded={expanded}
        className="ds-menu-item"
        {...({ commandfor: submenuId, command: "toggle-popover" } as Record<string, string>)}
        onPointerMove={(event) => {
          if (item.disabled) return;
          const under = document.elementFromPoint(event.clientX, event.clientY);
          if (under && !event.currentTarget.contains(under)) return;
          focusWithoutRing(event.currentTarget);
          if (window.matchMedia("(hover: hover)").matches && !expanded && !hoverTimerRef.current) {
            hoverTimerRef.current = window.setTimeout(() => {
              hoverTimerRef.current = null;
              openSubmenu(false);
            }, 110);
          }
        }}
        onPointerLeave={(event) => {
          if (hoverTimerRef.current) {
            window.clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
          }
          startSafeTriangle(event);
        }}
        onClick={(event) => {
          if (!hasNativeInvokers) {
            event.preventDefault();
            if (expanded) closeSubmenu(true, event.detail !== 0);
            else openSubmenu(event.detail === 0);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            event.stopPropagation();
            openSubmenu(true);
          }
        }}
      >
        {item.icon ? <span className="ds-menu-slot-icon" aria-hidden="true">{item.icon}</span> : null}
        <span>{item.label}</span>
        <span className="ds-menu-hint" aria-hidden="true">
          <ChevronRight className="h-4 w-4" />
        </span>
      </button>

      <div
        ref={popoverRef}
        id={submenuId}
        popover="auto"
        data-submenu="true"
        className="ds-menu-popover"
        onKeyDown={handleSubmenuKeyDown}
      >
        <div
          ref={groupRef}
          className="ds-menu-list"
          role={hasNativeFocusgroup ? undefined : "menu"}
          aria-labelledby={triggerId}
          {...({ focusgroup: "menu nomemory" } as Record<string, string>)}
        >
          <MenuItemsList
            items={item.items}
            rootClose={rootClose}
            hasNativeFocusgroup={hasNativeFocusgroup}
            hasNativeInvokers={hasNativeInvokers}
          />
        </div>
      </div>
    </>
  );
}

interface MenuItemsListProps {
  items: readonly DropdownMenuItem[];
  rootClose: (fromPointer: boolean) => void;
  hasNativeFocusgroup: boolean;
  hasNativeInvokers: boolean;
}

function MenuItemsList({
  items,
  rootClose,
  hasNativeFocusgroup,
  hasNativeInvokers,
}: MenuItemsListProps) {
  const handleItemPointerMove = (event: PointerEvent<HTMLElement>) => {
    const under = document.elementFromPoint(event.clientX, event.clientY);
    if (under && !event.currentTarget.contains(under)) return;
    focusWithoutRing(event.currentTarget);
  };

  return (
    <>
      {items.map((item) => {
        if (item.type === "separator") {
          return <hr key={item.id} />;
        }

        if (item.type === "submenu") {
          return (
            <SubmenuNode
              key={item.id}
              item={item}
              rootClose={rootClose}
              hasNativeFocusgroup={hasNativeFocusgroup}
              hasNativeInvokers={hasNativeInvokers}
            />
          );
        }

        if (item.type === "checkbox") {
          return (
            <button
              key={item.id}
              type="button"
              role="menuitemcheckbox"
              aria-checked={item.checked}
              disabled={item.disabled}
              data-checkable="true"
              className="ds-menu-item"
              onPointerMove={handleItemPointerMove}
              onKeyDown={(event) => {
                if (event.key === " ") {
                  event.preventDefault();
                  item.onCheckedChange(!item.checked);
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  item.onCheckedChange(!item.checked);
                  window.setTimeout(() => rootClose(false), 260);
                }
              }}
              onClick={(event: MouseEvent<HTMLButtonElement>) => {
                if (event.detail === 0) return;
                item.onCheckedChange(!item.checked);
                window.setTimeout(() => rootClose(true), 260);
              }}
            >
              <span>{item.label}</span>
            </button>
          );
        }

        if (item.type === "radio-group") {
          return (
            <div key={item.id} role="group" aria-label={item.label} className="flex flex-col gap-0.5">
              <p className="ds-menu-group-label" aria-hidden="true">
                {item.label}
              </p>
              {item.options.map((option) => {
                const isSelected = option.value === item.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    disabled={option.disabled}
                    data-checkable="radio"
                    className="ds-menu-item"
                    onPointerMove={handleItemPointerMove}
                    onClick={(event) => {
                      item.onValueChange(option.value);
                      const fromPointer = event.detail !== 0;
                      window.setTimeout(() => rootClose(fromPointer), 260);
                    }}
                  >
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          );
        }

        if (item.type === "link") {
          if (item.external) {
            return (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                role={hasNativeFocusgroup ? undefined : "menuitem"}
                aria-disabled={item.disabled ? "true" : undefined}
                className="ds-menu-item"
                onPointerMove={handleItemPointerMove}
                onClick={(event) => rootClose(event.detail !== 0)}
              >
                {item.icon ? <span className="ds-menu-slot-icon" aria-hidden="true">{item.icon}</span> : null}
                <span>{item.label}</span>
              </a>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              role={hasNativeFocusgroup ? undefined : "menuitem"}
              aria-disabled={item.disabled ? "true" : undefined}
              className="ds-menu-item"
              onPointerMove={handleItemPointerMove}
              onClick={(event) => rootClose(event.detail !== 0)}
            >
              {item.icon ? <span className="ds-menu-slot-icon" aria-hidden="true">{item.icon}</span> : null}
              <span>{item.label}</span>
            </Link>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            disabled={item.disabled}
            role={hasNativeFocusgroup ? undefined : "menuitem"}
            data-tone={item.tone === "danger" ? "danger" : undefined}
            className="ds-menu-item"
            onPointerMove={handleItemPointerMove}
            onClick={(event) => {
              item.onSelect();
              rootClose(event.detail !== 0);
            }}
          >
            {item.icon ? <span className="ds-menu-slot-icon" aria-hidden="true">{item.icon}</span> : null}
            <span>{item.label}</span>
            {item.shortcut ? (
              <span className="ds-menu-hint" aria-hidden="true">
                {item.shortcut}
              </span>
            ) : null}
          </button>
        );
      })}
    </>
  );
}

/**
 * Accessible custom DropdownMenu built on the native Popover API, Invoker Commands
 * (`commandfor` / `command="toggle-popover"`), `focusgroup="menu nomemory"`, and
 * CSS Anchor Positioning (`position-area` + `position-try-fallbacks`) with
 * feature-detected fallbacks for browsers lacking invokers, focusgroup, or anchor positioning.
 */
export function DropdownMenu({
  label,
  triggerIcon,
  hideChevron = false,
  ariaLabel,
  variant = "secondary",
  align = "start",
  items,
  className,
}: DropdownMenuProps) {
  const triggerId = useId();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  const [expanded, setExpanded] = useState(false);
  const enterOnOpenRef = useRef(false);
  const pointerPressedRef = useRef(false);

  const hasNativeFocusgroup = useHasNativeFocusgroup();
  const hasNativeInvokers = useHasNativeInvokers();

  const closeAndRestore = useCallback((fromPointer: boolean) => {
    const popover = popoverRef.current;
    const trigger = triggerRef.current;
    if (trigger) {
      if (fromPointer) focusWithoutRing(trigger);
      else trigger.focus({ preventScroll: true });
    }
    if (popover?.matches(":popover-open")) {
      popover.hidePopover();
    }
  }, []);

  useEffect(() => {
    const popover = popoverRef.current;
    const trigger = triggerRef.current;
    const group = groupRef.current;
    if (!popover || !trigger || !group) return;

    const handleToggle = (event: Event) => {
      const toggleEvent = event as ToggleEvent;
      const nextOpen = toggleEvent.newState === "open";
      setExpanded(nextOpen);

      if (nextOpen) {
        positionPopoverFallback(popover, trigger, false, align);
        if (enterOnOpenRef.current) {
          enterOnOpenRef.current = false;
          getOwnFocusableItems(group)[0]?.focus({ preventScroll: true });
        } else if (pointerPressedRef.current) {
          pointerPressedRef.current = false;
          focusWithoutRing(trigger);
        }
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!popover.matches(":popover-open")) return;
      const target = event.target as Node | null;
      if (target && !rootRef.current?.contains(target)) {
        popover.hidePopover();
      }
    };

    popover.addEventListener("toggle", handleToggle);
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      popover.removeEventListener("toggle", handleToggle);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [align]);

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const popover = popoverRef.current;
    const group = groupRef.current;
    if (!popover || !group) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (popover.matches(":popover-open")) {
        getOwnFocusableItems(group)[0]?.focus({ preventScroll: true });
      } else {
        enterOnOpenRef.current = true;
        if (hasNativeInvokers) {
          triggerRef.current?.click();
        } else {
          showPopoverWithSource(popover, event.currentTarget);
        }
      }
    } else if (event.key === "Enter" || event.key === " ") {
      if (!popover.matches(":popover-open")) {
        enterOnOpenRef.current = true;
      }
    }
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeAndRestore(false);
      return;
    }

    if (event.key === "Tab") {
      popoverRef.current?.hidePopover();
      return;
    }

    if (!hasNativeFocusgroup && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      const group = groupRef.current;
      if (!group) return;
      const ownItems = getOwnFocusableItems(group);
      const current = ownItems.indexOf(document.activeElement as HTMLElement);
      if (current < 0 || ownItems.length === 0) return;

      event.preventDefault();
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? ownItems.length - 1
            : (current + (event.key === "ArrowUp" ? -1 : 1) + ownItems.length) % ownItems.length;
      ownItems[next]?.focus({ preventScroll: true });
    }
  };

  return (
    <div ref={rootRef} className={cn("inline-flex", className)}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={expanded}
        className={cn(
          "ds-menu-trigger inline-flex cursor-pointer items-center justify-center gap-ds-2 transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange",
          triggerVariantClasses[variant],
        )}
        {...({ commandfor: menuId, command: "toggle-popover" } as Record<string, string>)}
        onPointerDown={(event) => {
          event.preventDefault();
          pointerPressedRef.current = true;
          enterOnOpenRef.current = false;
        }}
        onClick={(event) => {
          if (!hasNativeInvokers) {
            event.preventDefault();
            const popover = popoverRef.current;
            if (!popover) return;
            if (popover.matches(":popover-open")) {
              closeAndRestore(event.detail !== 0);
            } else {
              enterOnOpenRef.current = event.detail === 0;
              showPopoverWithSource(popover, event.currentTarget);
            }
          }
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        {triggerIcon ? <span aria-hidden="true" className="inline-flex shrink-0">{triggerIcon}</span> : null}
        {variant !== "icon" ? <span>{label}</span> : <span className="sr-only">{label}</span>}
        {variant !== "icon" && !hideChevron ? (
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-150",
              expanded && "rotate-180",
            )}
          />
        ) : null}
      </button>

      {/* Placed immediately after its trigger so browsers add no implicit aria-details */}
      <div
        ref={popoverRef}
        id={menuId}
        popover="auto"
        data-menu-root="true"
        data-align={align}
        className="ds-menu-popover"
        onKeyDown={handleMenuKeyDown}
      >
        {/* Nested inside popover because Chromium drops focusgroup keyboard behavior on popover root */}
        <div
          ref={groupRef}
          className="ds-menu-list"
          role={hasNativeFocusgroup ? undefined : "menu"}
          aria-labelledby={triggerId}
          {...({ focusgroup: "menu nomemory" } as Record<string, string>)}
        >
          <MenuItemsList
            items={items}
            rootClose={closeAndRestore}
            hasNativeFocusgroup={hasNativeFocusgroup}
            hasNativeInvokers={hasNativeInvokers}
          />
        </div>
      </div>
    </div>
  );
}
