"use client";

import { Clock } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { HOUR_OPTIONS, MINUTE_OPTIONS, pad2 } from "./date-utils";

interface DateTimeControlsProps {
  hour: number;
  minute: number;
  onTimeChange: (hour: number, minute: number) => void;
}

export function DateTimeControls({
  hour,
  minute,
  onTimeChange,
}: DateTimeControlsProps) {
  const minuteValues = MINUTE_OPTIONS.some((option) => option.value === minute)
    ? MINUTE_OPTIONS
    : [...MINUTE_OPTIONS, { value: minute, label: pad2(minute) }].sort(
        (a, b) => a.value - b.value,
      );

  return (
    <div className="mt-3 border-t border-ceda-line pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ceda-ink">
          <Clock aria-hidden="true" className="h-3.5 w-3.5 text-ceda-muted" />
          <span>Time</span>
        </span>

        <div className="flex items-center gap-1.5">
          <DropdownMenu
            label={pad2(hour)}
            ariaLabel="Select hour"
            variant="secondary"
            align="end"
            triggerClassName="min-h-8 rounded-lg px-2.5 text-xs font-semibold tabular-nums"
            menuClassName="max-h-56 overflow-y-auto"
            items={[
              {
                type: "radio-group",
                id: "hour-select",
                label: "Hour",
                value: String(hour),
                options: HOUR_OPTIONS.map((item) => ({
                  value: String(item.value),
                  label: `${item.label}:00`,
                })),
                onValueChange: (next) => onTimeChange(Number(next), minute),
              },
            ]}
          />
          <span aria-hidden="true" className="text-xs font-bold text-ceda-muted">
            :
          </span>
          <DropdownMenu
            label={pad2(minute)}
            ariaLabel="Select minute"
            variant="secondary"
            align="end"
            triggerClassName="min-h-8 rounded-lg px-2.5 text-xs font-semibold tabular-nums"
            menuClassName="max-h-56 overflow-y-auto"
            items={[
              {
                type: "radio-group",
                id: "minute-select",
                label: "Minute",
                value: String(minute),
                options: minuteValues.map((item) => ({
                  value: String(item.value),
                  label: `:${item.label}`,
                })),
                onValueChange: (next) => onTimeChange(hour, Number(next)),
              },
            ]}
          />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onTimeChange(8, 0)}
          className="rounded-full border border-ceda-line bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-ceda-muted transition hover:border-ceda-burgundy/40 hover:bg-ceda-cream hover:text-ceda-burgundy"
        >
          08:00 start
        </button>
        <button
          type="button"
          onClick={() => onTimeChange(17, 0)}
          className="rounded-full border border-ceda-line bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-ceda-muted transition hover:border-ceda-burgundy/40 hover:bg-ceda-cream hover:text-ceda-burgundy"
        >
          17:00 close
        </button>
        <button
          type="button"
          onClick={() => onTimeChange(23, 59)}
          className="rounded-full border border-ceda-line bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-ceda-muted transition hover:border-ceda-burgundy/40 hover:bg-ceda-cream hover:text-ceda-burgundy"
        >
          23:59 midnight
        </button>
      </div>
    </div>
  );
}
