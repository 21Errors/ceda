"use client";

import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  focusWithoutRing,
  getOwnFocusableItems,
  positionPopoverFallback,
  showPopoverWithSource,
} from "./menu-dom";
import type { DropdownSubmenuItem } from "./types";

interface SubmenuNodeProps {
  item: DropdownSubmenuItem;
  hasNativeFocusgroup: boolean;
  hasNativeInvokers: boolean;
  renderChildren: () => ReactNode;
}

export function SubmenuNode({
  item,
  hasNativeFocusgroup,
  hasNativeInvokers,
  renderChildren,
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
      if (
        moveEvent.target !== submenu ||
        (isLeft ? moveEvent.clientX < lastX : moveEvent.clientX > lastX)
      ) {
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

    if (
      !hasNativeFocusgroup &&
      ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
    ) {
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
            : (current + (event.key === "ArrowUp" ? -1 : 1) + items.length) %
              items.length;
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
        {...({ commandfor: submenuId, command: "toggle-popover" } as Record<
          string,
          string
        >)}
        onPointerMove={(event) => {
          if (item.disabled) return;
          const under = document.elementFromPoint(event.clientX, event.clientY);
          if (under && !event.currentTarget.contains(under)) return;
          focusWithoutRing(event.currentTarget);
          if (
            window.matchMedia("(hover: hover)").matches &&
            !expanded &&
            !hoverTimerRef.current
          ) {
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
        {item.icon ? (
          <span className="ds-menu-slot-icon" aria-hidden="true">
            {item.icon}
          </span>
        ) : null}
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
          {renderChildren()}
        </div>
      </div>
    </>
  );
}
