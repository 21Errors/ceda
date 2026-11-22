"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function useHasNativeFocusgroup(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => typeof HTMLElement !== "undefined" && "focusGroup" in HTMLElement.prototype,
    () => false,
  );
}

export function useHasNativeInvokers(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () =>
      typeof HTMLButtonElement !== "undefined" &&
      "commandForElement" in HTMLButtonElement.prototype,
    () => false,
  );
}

export function getOwnFocusableItems(group: HTMLElement): HTMLElement[] {
  return Array.from(
    group.querySelectorAll<HTMLElement>("button.ds-menu-item, a.ds-menu-item"),
  )
    .filter((item) => item.closest("[focusgroup]") === group)
    .filter((item) => {
      if (item instanceof HTMLButtonElement && item.disabled) return false;
      return item.getAttribute("aria-disabled") !== "true";
    });
}

export function positionPopoverFallback(
  popover: HTMLElement,
  trigger: HTMLElement,
  isSubmenu: boolean,
  align: "start" | "end",
) {
  if (typeof CSS !== "undefined" && CSS.supports("position-area", "block-end")) {
    return;
  }

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
      left = Math.min(
        window.innerWidth - menuRect.width - margin,
        triggerRect.left + 16,
      );
      top = Math.min(
        window.innerHeight - menuRect.height - margin,
        triggerRect.bottom + 4,
      );
    }
  } else {
    left = align === "end" ? triggerRect.right - menuRect.width : triggerRect.left;
    left = Math.max(
      margin,
      Math.min(left, window.innerWidth - menuRect.width - margin),
    );
    top = triggerRect.bottom + 6;
    if (top + menuRect.height > window.innerHeight - margin) {
      const above = triggerRect.top - menuRect.height - 6;
      if (above >= margin) top = above;
    }
  }

  popover.style.left = `${Math.round(left)}px`;
  popover.style.top = `${Math.round(top)}px`;
}

export function showPopoverWithSource(popover: HTMLElement, source: HTMLElement) {
  const fn = popover.showPopover as
    | ((options?: { source?: HTMLElement }) => void)
    | undefined;
  if (!fn) return;
  try {
    fn.call(popover, { source });
  } catch {
    popover.showPopover();
  }
}

export function focusWithoutRing(element: HTMLElement | null) {
  if (!element) return;
  try {
    (
      element as HTMLElement & {
        focus: (opts?: { focusVisible?: boolean; preventScroll?: boolean }) => void;
      }
    ).focus({
      focusVisible: false,
      preventScroll: true,
    });
  } catch {
    element.focus({ preventScroll: true });
  }
}
