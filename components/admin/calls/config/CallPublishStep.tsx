"use client";

import type { RefObject } from "react";
import { useState, useTransition } from "react";
import { Calendar, Check, CheckCircle2, Circle } from "lucide-react";
import { updateCallStatus } from "@/app/(workspace)/(dashboards)/admin/calls/actions";
import { cn } from "@/lib/cn";
import type { CallConfigSummary, CallStatusValue } from "./types";

interface CallPublishStepProps {
  call: CallConfigSummary;
  activeFieldsCount: number;
  stagesCount: number;
  activeCriteriaCount: number;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

const STATUS_CHOICES: readonly {
  value: CallStatusValue;
  label: string;
  description: string;
  dotClass: string;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    value: "draft",
    label: "Draft",
    description: "Hidden from applicants while you finish setup.",
    dotClass: "bg-neutral-500",
    activeClass:
      "border-neutral-500 bg-neutral-100 text-neutral-900 ring-2 ring-neutral-400/35",
    idleClass:
      "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50",
  },
  {
    value: "open",
    label: "Open",
    description: "Published and open for new applications.",
    dotClass: "bg-emerald-600",
    activeClass:
      "border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/25",
    idleClass:
      "border-emerald-200/80 bg-white text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50/50",
  },
  {
    value: "closed",
    label: "Closed",
    description: "Visible on the portal, but no longer accepting ideas.",
    dotClass: "bg-red-600",
    activeClass:
      "border-red-600 bg-red-50 text-red-950 ring-2 ring-red-500/25",
    idleClass:
      "border-red-200/80 bg-white text-red-900 hover:border-red-300 hover:bg-red-50/50",
  },
  {
    value: "archived",
    label: "Archived",
    description: "Hidden from active lists while keeping records intact.",
    dotClass: "bg-slate-500",
    activeClass:
      "border-slate-500 bg-slate-100 text-slate-900 ring-2 ring-slate-400/35",
    idleClass:
      "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
  },
];

export function CallPublishStep({
  call,
  activeFieldsCount,
  stagesCount,
  activeCriteriaCount,
  headingRef,
}: CallPublishStepProps) {
  const [selectedStatus, setSelectedStatus] = useState<CallStatusValue>(
    call.status,
  );
  const [pending, startTransition] = useTransition();

  const selectedMeta =
    STATUS_CHOICES.find((choice) => choice.value === selectedStatus) ??
    STATUS_CHOICES[0];

  const checklist = [
    {
      label: "Application questions",
      detail:
        activeFieldsCount > 0
          ? `${activeFieldsCount} active custom field${activeFieldsCount === 1 ? "" : "s"}`
          : "Using standard application form",
      done: true,
    },
    {
      label: "Review workflow",
      detail: `${stagesCount} stage${stagesCount === 1 ? "" : "s"} in sequence`,
      done: stagesCount > 0,
    },
    {
      label: "Scoring criteria",
      detail:
        activeCriteriaCount > 0
          ? `${activeCriteriaCount} active scoring rule${activeCriteriaCount === 1 ? "" : "s"}`
          : "No scoring criteria added yet",
      done: activeCriteriaCount > 0,
    },
  ];

  function handleSaveStatus() {
    const formData = new FormData();
    formData.set("callId", call.id);
    formData.set("status", selectedStatus);
    startTransition(async () => {
      await updateCallStatus(formData);
    });
  }

  return (
    <section
      aria-labelledby="step-publish-heading"
      className="space-y-6"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ceda-burgundy">
          Step 4 of 4
        </p>
        <h2
          id="step-publish-heading"
          ref={headingRef}
          tabIndex={-1}
          className="mt-1 text-xl font-bold text-ceda-ink focus:outline-none"
        >
          Review &amp; publish status
        </h2>
        <p className="mt-1 text-sm text-ceda-muted">
          Check your call schedule and choose whether applicants can see and
          submit to this call.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        {/* Status selector */}
        <div className="rounded-2xl border border-ceda-line bg-white p-6 shadow-xs sm:p-7">
          <fieldset className="space-y-3">
            <legend className="text-base font-bold text-ceda-ink">
              Call status
            </legend>
            <p className="text-xs text-ceda-muted">
              Select a status below and save to update this call immediately.
            </p>

            <div className="flex flex-wrap gap-2.5 pt-1">
              {STATUS_CHOICES.map((choice) => {
                const isSelected = selectedStatus === choice.value;
                return (
                  <label
                    key={choice.value}
                    className={cn(
                      "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ceda-ink/40",
                      isSelected ? choice.activeClass : choice.idleClass,
                    )}
                  >
                    <input
                      type="radio"
                      name="callStatus"
                      value={choice.value}
                      checked={isSelected}
                      onChange={() => setSelectedStatus(choice.value)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-2.5 w-2.5 shrink-0 rounded-full",
                        choice.dotClass,
                      )}
                    />
                    <span>{choice.label}</span>
                    {isSelected ? (
                      <Check
                        aria-hidden="true"
                        className="h-3.5 w-3.5 shrink-0"
                      />
                    ) : null}
                  </label>
                );
              })}
            </div>

            <p className="text-xs text-ceda-muted">{selectedMeta.description}</p>
          </fieldset>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-ceda-line pt-5">
            <button
              type="button"
              disabled={pending}
              onClick={handleSaveStatus}
              className="inline-flex min-h-11 items-center rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white transition hover:bg-ceda-burgundy-dark disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
            >
              {pending ? "Saving…" : "Save status"}
            </button>
            {selectedStatus !== call.status ? (
              <span className="text-xs font-medium text-ceda-muted">
                Unsaved change ({call.status} → {selectedStatus})
              </span>
            ) : (
              <span className="text-xs text-ceda-muted">
                Current saved status:{" "}
                <strong className="capitalize text-ceda-ink">
                  {call.status}
                </strong>
              </span>
            )}
          </div>
        </div>

        {/* Summary & Schedule */}
        <div className="space-y-4">
          <section className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6">
            <h3 className="text-base font-bold text-ceda-ink">
              Setup checklist
            </h3>
            <ul className="mt-4 space-y-3">
              {checklist.map((item) => (
                <li
                  key={item.label}
                  className="flex items-start gap-2.5 text-sm"
                >
                  {item.done ? (
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    />
                  ) : (
                    <Circle
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-ceda-ink">{item.label}</p>
                    <p className="text-xs text-ceda-muted">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center gap-2">
              <Calendar
                aria-hidden="true"
                className="h-4 w-4 text-ceda-burgundy"
              />
              <h3 className="text-base font-bold text-ceda-ink">
                Call schedule
              </h3>
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-ceda-muted">Opens</dt>
                <dd className="font-semibold text-ceda-ink">
                  {call.opensAtLabel}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-ceda-muted">Closes</dt>
                <dd className="font-semibold text-ceda-ink">
                  {call.closesAtLabel}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </section>
  );
}
