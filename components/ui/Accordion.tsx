"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface AccordionItem {
  id: string;
  summary: string;
  content: ReactNode;
  defaultOpen?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  heading?: string;
  label?: string;
  exclusiveName?: string;
  showToggleAll?: boolean;
  className?: string;
}

/**
 * Native `<details>` / `<summary>` Accordion:
 * - No headings nested inside `<summary>` (preserves button semantics in JAWS/TalkBack)
 * - Leading rotated chevron indicator with `::details-content` intrinsic block-size animation
 * - Optional exclusive `name` group with JS fallback where `HTMLDetailsElement.prototype.name` is missing
 * - Optional Expand all / Collapse all button synced via `aria-expanded`
 */
export function Accordion({
  items,
  heading,
  label,
  exclusiveName,
  showToggleAll = false,
  className,
}: AccordionProps) {
  const headingId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [allExpanded, setAllExpanded] = useState(() =>
    items.length > 0 && items.every((item) => Boolean(item.defaultOpen)),
  );

  const syncExpandedState = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    const detailsEls = Array.from(root.querySelectorAll<HTMLDetailsElement>(":scope > details"));
    setAllExpanded(detailsEls.length > 0 && detailsEls.every((el) => el.open));
  }, []);

  // Fallback for mutually exclusive `details[name]` on browsers lacking native support
  useEffect(() => {
    if (!exclusiveName) return;
    if (typeof HTMLDetailsElement !== "undefined" && Object.hasOwn(HTMLDetailsElement.prototype, "name")) {
      return;
    }
    const root = containerRef.current;
    if (!root) return;

    const handleToggle = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLDetailsElement) || !target.open) return;
      const siblings = root.querySelectorAll<HTMLDetailsElement>(":scope > details");
      for (const other of siblings) {
        if (other !== target) other.open = false;
      }
    };

    root.addEventListener("toggle", handleToggle, { capture: true });
    return () => root.removeEventListener("toggle", handleToggle, { capture: true });
  }, [exclusiveName]);

  const toggleAll = () => {
    const root = containerRef.current;
    if (!root) return;
    const nextOpen = !allExpanded;
    for (const el of root.querySelectorAll<HTMLDetailsElement>(":scope > details")) {
      el.open = nextOpen;
    }
    setAllExpanded(nextOpen);
  };

  return (
    <div
      aria-labelledby={heading ? headingId : undefined}
      aria-label={!heading ? label : undefined}
      className={cn("overflow-hidden rounded-card border border-ceda-line bg-white shadow-xs", className)}
    >
      {heading || (showToggleAll && !exclusiveName) ? (
        <div className="flex flex-wrap items-center justify-between gap-cluster border-b border-ceda-line bg-ceda-cream px-ds-5 py-ds-4">
          {heading ? (
            <h3 id={headingId} className="text-base font-bold text-ceda-ink">
              {heading}
            </h3>
          ) : (
            <span />
          )}
          {showToggleAll && !exclusiveName ? (
            <button
              type="button"
              aria-expanded={allExpanded}
              onClick={toggleAll}
              className="inline-flex min-h-9 items-center rounded-full border border-ceda-line bg-white px-ds-4 text-xs font-bold text-ceda-burgundy transition hover:bg-ceda-cream-mid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
            >
              {allExpanded ? "Collapse all" : "Expand all"}
            </button>
          ) : null}
        </div>
      ) : null}

      <div ref={containerRef} className="ds-accordion">
        {items.map((item) => (
          <details
            key={item.id}
            name={exclusiveName}
            open={item.defaultOpen}
            onToggle={syncExpandedState}
          >
            <summary>{item.summary}</summary>
            <div className="px-ds-5 pb-ds-5 ps-ds-12 text-sm leading-6 text-ceda-body">
              {item.content}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
