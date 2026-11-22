"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useSwipeDrawer(pathname: string) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const dialog = drawerRef.current;
    if (dialog?.open) {
      dialog.close();
    }
  }, [pathname]);

  return {
    drawerRef,
    scrollerRef,
    sheetRef,
    drawerOpen,
    openDrawer,
    closeDrawer,
  };
}
