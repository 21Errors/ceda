"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  label: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (id: string) => void;
  className?: string;
  panelClassName?: string;
}

/**
 * Accessible single-row scrollable Tabs following modern web platform patterns:
 * - Renders initial state in HTML (`aria-selected` & `hidden="until-found"`)
 * - Supports `focusgroup="tablist nomemory"` + roving-tabIndex arrow-key navigation
 * - Listens to `beforematch` so browser Find-in-Page reveals & activates matching panels
 * - Places panel chrome on an inner wrapper (never on `role="tabpanel"` itself)
 */
export function Tabs({
  items,
  label,
  defaultValue,
  value,
  onValueChange,
  className,
  panelClassName,
}: TabsProps) {
  const baseId = useId();
  const [internalId, setInternalId] = useState(defaultValue ?? items[0]?.id ?? "");
  const activeId = value ?? internalId;

  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const panelRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const selectTab = useCallback(
    (nextId: string) => {
      if (value === undefined) {
        setInternalId(nextId);
      }
      onValueChange?.(nextId);

      const tabEl = tabRefs.current.get(nextId);
      tabEl?.scrollIntoView({ block: "nearest", inline: "nearest" });
    },
    [onValueChange, value],
  );

  // Sync tab selection when Find-in-Page matches text inside a hidden="until-found" panel
  useEffect(() => {
    const cleanups: (() => void)[] = [];

    for (const item of items) {
      const panel = panelRefs.current.get(item.id);
      if (!panel) continue;
      const onBeforeMatch = () => selectTab(item.id);
      panel.addEventListener("beforematch", onBeforeMatch);
      cleanups.push(() => panel.removeEventListener("beforematch", onBeforeMatch));
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [items, selectTab]);

  // IntersectionObserver fallback for edge fades when scroll-driven animations are unsupported
  useEffect(() => {
    const scroller = listRef.current;
    if (!scroller || typeof CSS === "undefined") return;
    if (CSS.supports("animation-timeline", "scroll(self inline)")) return;

    const first = scroller.firstElementChild;
    const last = scroller.lastElementChild;
    if (!first || !last) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === first) {
            scroller.classList.toggle("more-start", entry.intersectionRatio < 1);
          }
          if (entry.target === last) {
            scroller.classList.toggle("more-end", entry.intersectionRatio < 1);
          }
        }
      },
      { root: scroller, threshold: 1, rootMargin: "1px" },
    );

    observer.observe(first);
    observer.observe(last);
    return () => observer.disconnect();
  }, [items.length]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % items.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + items.length) % items.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = items.length - 1;

    if (nextIndex === null) return;
    event.preventDefault();
    const targetItem = items[nextIndex];
    if (!targetItem) return;
    selectTab(targetItem.id);
    tabRefs.current.get(targetItem.id)?.focus();
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        className="ds-tablist"
        {...({ focusgroup: "tablist nomemory" } as Record<string, string>)}
      >
        {items.map((item, index) => {
          const selected = item.id === activeId;
          const tabId = `${baseId}-tab-${item.id}`;
          return (
            <button
              key={item.id}
              ref={(node) => {
                if (node) tabRefs.current.set(item.id, node);
                else tabRefs.current.delete(item.id);
              }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className="ds-tab"
              {...(selected ? ({ focusgroupstart: "" } as Record<string, string>) : {})}
            >
              <span>{item.label}</span>
              {item.badge !== undefined ? (
                <span className="rounded-full bg-ceda-cream-mid px-2 py-0.5 text-xs font-bold tabular-nums text-ceda-burgundy">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* All panels share a single grid cell so hidden="until-found" panels never add stray gap */}
      <div className="grid">
        {items.map((item) => {
          const selected = item.id === activeId;
          const tabId = `${baseId}-tab-${item.id}`;
          return (
            <div
              key={item.id}
              ref={(node) => {
                if (node) panelRefs.current.set(item.id, node);
                else panelRefs.current.delete(item.id);
              }}
              role="tabpanel"
              aria-labelledby={tabId}
              tabIndex={selected ? 0 : undefined}
              hidden={selected ? undefined : ("until-found" as unknown as boolean)}
              className="col-start-1 row-start-1 focus-visible:outline-none"
            >
              {/* Box styles live on inner wrapper so hidden="until-found" panels don't render empty strips */}
              <div className={cn("pt-ds-5", panelClassName)}>{item.content}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
