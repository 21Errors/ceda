"use client";

import type { RefObject } from "react";
import { FileQuestion } from "lucide-react";
import { setFormFieldActive } from "@/app/(workspace)/(dashboards)/admin/calls/actions";
import { AddCallFormFieldForm } from "@/components/admin/calls/AddCallFormFieldForm";
import type { CallFieldItem } from "./types";

interface CallFieldsStepProps {
  callId: string;
  fields: readonly CallFieldItem[];
  headingRef: RefObject<HTMLHeadingElement | null>;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Short text",
  textarea: "Long text",
  url: "Web address",
  number: "Number",
  date: "Date",
  select: "Choose one",
  multiselect: "Choose multiple",
  checkbox: "Confirmation",
};

export function CallFieldsStep({
  callId,
  fields,
  headingRef,
}: CallFieldsStepProps) {
  return (
    <section
      aria-labelledby="step-fields-heading"
      className="space-y-6"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ceda-burgundy">
          Step 1 of 4
        </p>
        <h2
          id="step-fields-heading"
          ref={headingRef}
          tabIndex={-1}
          className="mt-1 text-xl font-bold text-ceda-ink focus:outline-none"
        >
          Application form fields
        </h2>
        <p className="mt-1 text-sm text-ceda-muted">
          Choose the extra questions applicants answer when submitting an idea.
          Active fields appear on the submission form right away.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        {/* Existing fields */}
        <div className="space-y-3 rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-center justify-between gap-2 border-b border-ceda-line pb-3">
            <h3 className="text-base font-bold text-ceda-ink">
              Configured fields
            </h3>
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-ceda-muted">
              {fields.filter((field) => field.isActive).length} active /{" "}
              {fields.length} total
            </span>
          </div>

          {fields.length > 0 ? (
            <div className="space-y-3">
              {fields.map((field) => (
                <article
                  key={field.id}
                  className={`rounded-xl border border-ceda-line p-4 transition ${
                    field.isActive ? "bg-white" : "bg-neutral-50 opacity-75"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          id={`field-title-${field.id}`}
                          className="font-semibold text-ceda-ink"
                        >
                          {field.label}
                          {field.required ? (
                            <span
                              className="ms-1 text-ceda-burgundy"
                              aria-hidden="true"
                            >
                              *
                            </span>
                          ) : null}
                        </h4>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            field.isActive
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-neutral-200 text-neutral-700"
                          }`}
                        >
                          {field.isActive ? "Active" : "Hidden"}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-ceda-muted">
                        <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-ceda-ink">
                          {field.key}
                        </code>{" "}
                        · {FIELD_TYPE_LABELS[field.type] ?? field.type} ·{" "}
                        <span className="capitalize">
                          {field.sectionKey.replaceAll("_", " ")}
                        </span>
                        {field.options?.length
                          ? ` · Choices: ${field.options.join(", ")}`
                          : ""}
                      </p>

                      {field.helpText ? (
                        <p className="mt-2 text-sm text-ceda-body">
                          {field.helpText}
                        </p>
                      ) : null}
                    </div>

                    <form
                      action={setFormFieldActive}
                      aria-labelledby={`field-title-${field.id}`}
                      className="shrink-0"
                    >
                      <input type="hidden" name="callId" value={callId} />
                      <input type="hidden" name="fieldId" value={field.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={String(!field.isActive)}
                      />
                      <button
                        type="submit"
                        className="min-h-10 rounded-full border border-ceda-line bg-white px-4 text-xs font-semibold text-ceda-burgundy transition hover:bg-ceda-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                      >
                        {field.isActive ? "Hide field" : "Activate"}
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-400 shadow-xs"
              >
                <FileQuestion className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-ceda-ink">
                No extra form fields yet
              </p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-ceda-muted">
                Use the form on the right to add custom questions for this call,
                or continue to the next step to use the default form.
              </p>
            </div>
          )}
        </div>

        {/* Add new field */}
        <div className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6">
          <AddCallFormFieldForm callId={callId} />
        </div>
      </div>
    </section>
  );
}
