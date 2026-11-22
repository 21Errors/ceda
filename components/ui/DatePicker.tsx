"use client";

import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import {
  positionPopoverFallback,
  showPopoverWithSource,
  useHasNativeInvokers,
} from "@/components/ui/dropdown/menu-dom";
import { CalendarGrid } from "./date-picker/CalendarGrid";
import { DateTimeControls } from "./date-picker/DateTimeControls";
import {
  MONTH_NAMES,
  extractIsoDate,
  formatDateValue,
  formatDisplayDate,
  getTodayParts,
  parseDateValue,
  type CalendarCell,
} from "./date-picker/date-utils";

const emptySubscribe = () => () => {};

function getClientTodayIso(): string {
  return getTodayParts().isoDate;
}

function useHasNativePopover(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () =>
      typeof HTMLElement !== "undefined" &&
      Object.hasOwn(HTMLElement.prototype, "popover"),
    () => true,
  );
}

export interface DatePickerProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  includeTime?: boolean;
  defaultTime?: { hour: number; minute: number };
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  ariaDescribedBy?: string;
  className?: string;
}

/**
 * Reusable accessible DatePicker built on the native Popover API and CSS Anchor
 * Positioning (`position-area` + `position-try-fallbacks`) with a JS positioning
 * fallback, supporting both date-only (`YYYY-MM-DD`) and date-time
 * (`YYYY-MM-DDTHH:mm`) values.
 */
export function DatePicker({
  id: providedId,
  name,
  value,
  onChange,
  onBlur,
  includeTime = false,
  defaultTime = { hour: 8, minute: 0 },
  placeholder,
  minDate,
  maxDate,
  disabled = false,
  required = false,
  invalid = false,
  ariaDescribedBy,
  className,
}: DatePickerProps) {
  const generatedId = useId();
  const triggerId = providedId ?? generatedId;
  const popoverId = `${triggerId}-calendar`;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hasNativeInvokers = useHasNativeInvokers();
  const hasNativePopover = useHasNativePopover();

  const todayIso = useSyncExternalStore(emptySubscribe, getClientTodayIso, () => "");
  const todayParsed = parseDateValue(todayIso, false);
  const parsed = parseDateValue(value, includeTime);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(
    () => parsed?.year ?? todayParsed?.year ?? 2026,
  );
  const [viewMonth, setViewMonth] = useState(
    () => parsed?.month ?? todayParsed?.month ?? 0,
  );

  const activeHour = parsed?.hour ?? defaultTime.hour;
  const activeMinute = parsed?.minute ?? defaultTime.minute;
  const selectedIso = parsed
    ? formatDateValue(parsed, false)
    : null;
  const minIso = extractIsoDate(minDate);
  const maxIso = extractIsoDate(maxDate);

  const currentYear = todayParsed?.year ?? 2026;
  const yearOptions = Array.from({ length: 12 }, (_, idx) => currentYear - 2 + idx);

  const closePopover = useCallback(
    (restoreFocus: boolean) => {
      const popover = popoverRef.current;
      if (hasNativePopover && popover?.matches(":popover-open")) {
        popover.hidePopover();
      } else if (!hasNativePopover) {
        setOpen(false);
        onBlur?.();
      }
      if (restoreFocus) {
        triggerRef.current?.focus({ preventScroll: true });
      }
    },
    [hasNativePopover, onBlur],
  );

  useEffect(() => {
    const popover = popoverRef.current;
    const trigger = triggerRef.current;
    if (!popover || !trigger) return;

    const handleToggle = (event: Event) => {
      const nextOpen = (event as ToggleEvent).newState === "open";
      setOpen(nextOpen);
      if (nextOpen) {
        const nextParsed = parseDateValue(value, includeTime);
        if (nextParsed) {
          setViewYear(nextParsed.year);
          setViewMonth(nextParsed.month);
        } else {
          const now = getTodayParts();
          setViewYear(now.year);
          setViewMonth(now.month);
        }
        positionPopoverFallback(popover, trigger, false, "start");
      } else {
        onBlur?.();
      }
    };

    popover.addEventListener("toggle", handleToggle);
    return () => popover.removeEventListener("toggle", handleToggle);
  }, [includeTime, onBlur, value]);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const handleSelectCell = (cell: CalendarCell) => {
    const nextValue = formatDateValue(
      {
        year: cell.year,
        month: cell.month,
        day: cell.day,
        hour: activeHour,
        minute: activeMinute,
      },
      includeTime,
    );
    setViewYear(cell.year);
    setViewMonth(cell.month);
    onChange(nextValue);
    if (!includeTime) {
      closePopover(true);
    }
  };

  const handleTimeChange = (hour: number, minute: number) => {
    const now = getTodayParts();
    const base = parsed ?? {
      year: now.year,
      month: now.month,
      day: now.day,
      hour,
      minute,
    };
    onChange(
      formatDateValue(
        {
          year: base.year,
          month: base.month,
          day: base.day,
          hour,
          minute,
        },
        true,
      ),
    );
  };

  const handlePickToday = () => {
    const now = getTodayParts();
    if (minIso && now.isoDate < minIso) return;
    if (maxIso && now.isoDate > maxIso) return;
    setViewYear(now.year);
    setViewMonth(now.month);
    onChange(
      formatDateValue(
        {
          year: now.year,
          month: now.month,
          day: now.day,
          hour: activeHour,
          minute: activeMinute,
        },
        includeTime,
      ),
    );
    if (!includeTime) {
      closePopover(true);
    }
  };

  const handlePopoverKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closePopover(true);
    }
  };

  const displayText = formatDisplayDate(value, includeTime);
  const resolvedPlaceholder =
    placeholder ?? (includeTime ? "Choose date and time" : "Choose a date");

  return (
    <div className={cn("relative", className)}>
      {name ? (
        <input type="hidden" name={name} value={value} required={required} />
      ) : null}

      <div className="relative flex items-center">
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-controls={popoverId}
          aria-describedby={ariaDescribedBy}
          data-user-invalid={invalid ? "true" : undefined}
          {...(hasNativePopover && hasNativeInvokers
            ? ({ commandfor: popoverId, command: "toggle-popover" } as Record<
                string,
                string
              >)
            : {})}
          onClick={(event) => {
            if (!hasNativePopover) {
              event.preventDefault();
              setOpen((prev) => {
                const next = !prev;
                if (next && popoverRef.current && triggerRef.current) {
                  positionPopoverFallback(
                    popoverRef.current,
                    triggerRef.current,
                    false,
                    "start",
                  );
                } else if (!next) {
                  onBlur?.();
                }
                return next;
              });
              return;
            }
            if (!hasNativeInvokers) {
              event.preventDefault();
              const popover = popoverRef.current;
              if (!popover) return;
              if (popover.matches(":popover-open")) {
                closePopover(true);
              } else {
                showPopoverWithSource(popover, event.currentTarget);
              }
            }
          }}
          className={cn(
            "ds-input ds-field-control flex items-center justify-between gap-2 text-start",
            value ? "pe-10 text-ceda-ink" : "text-ceda-muted",
            invalid && "border-(--status-danger-border) bg-(--status-danger-bg)",
          )}
        >
          <span className="flex min-w-0 items-center gap-2.5 truncate">
            <Calendar
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-ceda-burgundy"
            />
            <span className="truncate font-normal">
              {displayText || resolvedPlaceholder}
            </span>
          </span>
        </button>

        {value && !disabled ? (
          <button
            type="button"
            aria-label="Clear date"
            onClick={() => {
              onChange("");
              onBlur?.();
            }}
            className="absolute end-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-ceda-muted transition hover:bg-neutral-100 hover:text-ceda-burgundy focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-orange"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div
        ref={popoverRef}
        id={popoverId}
        popover={hasNativePopover ? "auto" : undefined}
        hidden={!hasNativePopover && !open}
        role="dialog"
        aria-label={includeTime ? "Choose date and time" : "Choose a date"}
        data-menu-root="true"
        data-align="start"
        onKeyDown={handlePopoverKeyDown}
        className={cn(
          "ds-menu-popover w-[min(20.5rem,calc(100vw-2rem))] max-w-none p-4",
          !hasNativePopover && "z-50",
        )}
      >
        {/* Month / Year Header using custom DropdownMenu */}
        <div className="mb-3 flex items-center justify-between gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ceda-line text-ceda-body transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-orange"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1">
            <DropdownMenu
              label={MONTH_NAMES[viewMonth]}
              ariaLabel="Select month"
              variant="ghost"
              triggerClassName="min-h-8 rounded-lg px-2.5 text-xs font-bold text-ceda-ink"
              menuClassName="max-h-60 overflow-y-auto"
              items={[
                {
                  type: "radio-group",
                  id: "month-select",
                  label: "Month",
                  value: String(viewMonth),
                  options: MONTH_NAMES.map((monthName, idx) => ({
                    value: String(idx),
                    label: monthName,
                  })),
                  onValueChange: (next) => setViewMonth(Number(next)),
                },
              ]}
            />
            <DropdownMenu
              label={String(viewYear)}
              ariaLabel="Select year"
              variant="ghost"
              align="end"
              triggerClassName="min-h-8 rounded-lg px-2.5 text-xs font-bold tabular-nums text-ceda-ink"
              menuClassName="max-h-60 overflow-y-auto"
              items={[
                {
                  type: "radio-group",
                  id: "year-select",
                  label: "Year",
                  value: String(viewYear),
                  options: yearOptions.map((year) => ({
                    value: String(year),
                    label: String(year),
                  })),
                  onValueChange: (next) => setViewYear(Number(next)),
                },
              ]}
            />
          </div>

          <button
            type="button"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ceda-line text-ceda-body transition hover:bg-ceda-cream hover:text-ceda-burgundy focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-orange"
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <CalendarGrid
          viewYear={viewYear}
          viewMonth={viewMonth}
          selectedIso={selectedIso}
          todayIso={todayIso}
          minIso={minIso}
          maxIso={maxIso}
          onSelectCell={handleSelectCell}
          onShiftMonth={shiftMonth}
        />

        {includeTime ? (
          <DateTimeControls
            hour={activeHour}
            minute={activeMinute}
            onTimeChange={handleTimeChange}
          />
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-ceda-line pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePickToday}
              className="rounded-full px-2.5 py-1 text-xs font-semibold text-ceda-burgundy transition hover:bg-ceda-cream focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-orange"
            >
              Today
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-full px-2.5 py-1 text-xs font-semibold text-ceda-muted transition hover:bg-neutral-100 hover:text-ceda-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-orange"
              >
                Clear
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => closePopover(true)}
            className="inline-flex min-h-8 items-center rounded-full bg-ceda-burgundy px-3.5 text-xs font-bold text-white transition hover:bg-ceda-burgundy-dark focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-orange"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
