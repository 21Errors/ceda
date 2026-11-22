"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CallConfigStepKey } from "./types";

export interface StepDefinition {
  key: CallConfigStepKey;
  stepNumber: number;
  title: string;
  subtitle: string;
  countLabel: string;
  completed: boolean;
}

interface CallConfigStepperProps {
  steps: readonly StepDefinition[];
  activeStep: CallConfigStepKey;
  onSelectStep: (step: CallConfigStepKey) => void;
}

export function CallConfigStepper({
  steps,
  activeStep,
  onSelectStep,
}: CallConfigStepperProps) {
  return (
    <nav
      aria-label="Call setup steps"
      className="rounded-2xl border border-ceda-line bg-white p-3 shadow-xs sm:p-4"
    >
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => {
          const isCurrent = step.key === activeStep;
          return (
            <li key={step.key}>
              <button
                type="button"
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => onSelectStep(step.key)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-start transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange",
                  isCurrent
                    ? "border-ceda-burgundy bg-ceda-cream/70 shadow-xs"
                    : "border-transparent bg-neutral-50/70 hover:border-ceda-line hover:bg-neutral-50",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums transition",
                    isCurrent
                      ? "bg-ceda-burgundy text-white"
                      : step.completed
                        ? "border border-ceda-burgundy/25 bg-ceda-cream-mid text-ceda-burgundy"
                        : "border border-neutral-300 bg-white text-ceda-muted",
                  )}
                >
                  {step.completed && !isCurrent ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    step.stepNumber
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "truncate text-sm font-bold",
                        isCurrent ? "text-ceda-burgundy" : "text-ceda-ink",
                      )}
                    >
                      {step.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold tabular-nums text-ceda-muted ring-1 ring-ceda-line">
                      {step.countLabel}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ceda-muted">
                    {step.subtitle}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
