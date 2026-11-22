"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export type CallInitialStatus = "draft" | "open" | "closed";

interface CallStatusPillsProps {
  value: CallInitialStatus;
  onChange: (status: CallInitialStatus) => void;
  name?: string;
}

const STATUS_OPTIONS: readonly {
  value: CallInitialStatus;
  label: string;
  hint: string;
  dotClass: string;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    value: "draft",
    label: "Draft",
    hint: "Hidden while you set up the form",
    dotClass: "bg-neutral-500",
    activeClass:
      "border-neutral-500 bg-neutral-100 text-neutral-900 ring-2 ring-neutral-400/35",
    idleClass:
      "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50",
  },
  {
    value: "open",
    label: "Open",
    hint: "Accepting applications right away",
    dotClass: "bg-emerald-600",
    activeClass:
      "border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/25",
    idleClass:
      "border-emerald-200/80 bg-white text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50/50",
  },
  {
    value: "closed",
    label: "Closed",
    hint: "Visible as closed to new applicants",
    dotClass: "bg-red-600",
    activeClass:
      "border-red-600 bg-red-50 text-red-950 ring-2 ring-red-500/25",
    idleClass:
      "border-red-200/80 bg-white text-red-900 hover:border-red-300 hover:bg-red-50/50",
  },
];

export function CallStatusPills({
  value,
  onChange,
  name = "status",
}: CallStatusPillsProps) {
  const selectedMeta =
    STATUS_OPTIONS.find((option) => option.value === value) ?? STATUS_OPTIONS[0];

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-ceda-ink">
        Initial status
        <span className="ms-1 text-ceda-burgundy" aria-hidden="true">
          *
        </span>
      </legend>

      <div className="flex flex-wrap gap-2.5">
        {STATUS_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ceda-ink/40",
                isSelected ? option.activeClass : option.idleClass,
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                required
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn("h-2.5 w-2.5 shrink-0 rounded-full", option.dotClass)}
              />
              <span>{option.label}</span>
              {isSelected ? (
                <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              ) : null}
            </label>
          );
        })}
      </div>

      <p className="text-xs text-ceda-muted">{selectedMeta.hint}</p>
    </fieldset>
  );
}
