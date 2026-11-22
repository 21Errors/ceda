"use client";

import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  focusWithoutRing,
  getOwnFocusableItems,
  positionPopoverFallback,
  showPopoverWithSource,
  useHasNativeFocusgroup,
  useHasNativeInvokers,
} from "./dropdown/menu-dom";
import { MenuItemsList } from "./dropdown/MenuItemsList";
import type { DropdownMenuProps } from "./dropdown/types";

export type {
  DropdownCheckboxItem,
  DropdownCommandItem,
  DropdownLinkItem,
  DropdownMenuItem,
  DropdownMenuProps,
  DropdownRadioGroupItem,
  DropdownSeparatorItem,
  DropdownSubmenuItem,
} from "./dropdown/types";

const triggerVariantClasses = {
  primary:
    "min-h-11 justify-center rounded-full bg-ceda-burgundy px-ds-5 text-sm font-bold text-white shadow-xs hover:bg-ceda-burgundy-dark",
  secondary:
    "min-h-11 justify-center rounded-full border border-ceda-line bg-white px-ds-5 text-sm font-bold text-ceda-ink shadow-xs hover:border-ceda-burgundy/40 hover:bg-ceda-cream hover:text-ceda-burgundy",
  ghost:
    "min-h-10 justify-center rounded-full px-ds-4 text-sm font-semibold text-ceda-body hover:bg-ceda-cream hover:text-ceda-burgundy",
  icon: "h-10 w-10 justify-center rounded-full border border-ceda-line bg-white p-0 text-ceda-body shadow-xs hover:border-ceda-burgundy/40 hover:bg-ceda-cream hover:text-ceda-burgundy",
  field:
    "ds-input w-full justify-between bg-white text-start text-sm font-normal text-ceda-ink",
};

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
  triggerClassName,
  menuClassName,
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

    if (
      !hasNativeFocusgroup &&
      ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
    ) {
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
            : (current + (event.key === "ArrowUp" ? -1 : 1) + ownItems.length) %
              ownItems.length;
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
          "ds-menu-trigger inline-flex cursor-pointer items-center gap-ds-2 transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange",
          triggerVariantClasses[variant],
          triggerClassName,
        )}
        {...({ commandfor: menuId, command: "toggle-popover" } as Record<
          string,
          string
        >)}
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
        {triggerIcon ? (
          <span aria-hidden="true" className="inline-flex shrink-0">
            {triggerIcon}
          </span>
        ) : null}
        {variant !== "icon" ? (
          <span className="min-w-0 truncate">{label}</span>
        ) : (
          <span className="sr-only">{label}</span>
        )}
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
          className={cn("ds-menu-list", menuClassName)}
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
