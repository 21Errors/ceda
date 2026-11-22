"use client";

import type { KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import {
  MONTH_NAMES,
  WEEKDAY_LABELS,
  buildMonthGrid,
  type CalendarCell,
} from "./date-utils";

interface CalendarGridProps {
  viewYear: number;
  viewMonth: number;
  selectedIso: string | null;
  todayIso: string;
  minIso: string | null;
  maxIso: string | null;
  onSelectCell: (cell: CalendarCell) => void;
  onShiftMonth: (delta: number) => void;
}

export function CalendarGrid({
  viewYear,
  viewMonth,
  selectedIso,
  todayIso,
  minIso,
  maxIso,
  onSelectCell,
  onShiftMonth,
}: CalendarGridProps) {
  const cells = buildMonthGrid(viewYear, viewMonth);

  const isDisabled = (isoDate: string) => {
    if (minIso && isoDate < minIso) return true;
    if (maxIso && isoDate > maxIso) return true;
    return false;
  };

  const handleGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "PageUp") {
      event.preventDefault();
      onShiftMonth(-1);
    } else if (event.key === "PageDown") {
      event.preventDefault();
      onShiftMonth(1);
    }
  };

  return (
    <div
      role="grid"
      aria-label={`${MONTH_NAMES[viewMonth]} ${viewYear}`}
      onKeyDown={handleGridKeyDown}
    >
      <div role="row" className="mb-1.5 grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((day) => (
          <span
            key={day}
            role="columnheader"
            className="py-1 text-[11px] font-bold uppercase tracking-wider text-ceda-muted"
          >
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const disabled = isDisabled(cell.isoDate);
          const selected = selectedIso === cell.isoDate;
          const isToday = todayIso === cell.isoDate;

          return (
            <button
              key={cell.isoDate}
              type="button"
              disabled={disabled}
              aria-label={`${cell.day} ${MONTH_NAMES[cell.month]} ${cell.year}`}
              aria-pressed={selected}
              aria-current={isToday ? "date" : undefined}
              onClick={() => onSelectCell(cell)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-sm tabular-nums transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-orange",
                selected
                  ? "bg-ceda-burgundy font-bold text-white shadow-xs hover:bg-ceda-burgundy-dark"
                  : cell.inCurrentMonth
                    ? "font-medium text-ceda-ink hover:bg-ceda-cream hover:text-ceda-burgundy"
                    : "text-neutral-400 hover:bg-neutral-100 hover:text-ceda-ink",
                isToday &&
                  !selected &&
                  "ring-1 ring-ceda-burgundy/45 font-bold text-ceda-burgundy",
                disabled && "cursor-not-allowed opacity-35 hover:bg-transparent",
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
