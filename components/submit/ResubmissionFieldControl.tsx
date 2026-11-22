"use client";

import type { Path, UseFormRegister } from "react-hook-form";
import { FieldErrorMessage } from "@/components/ui/FormErrorFeedback";
import type { ResubmissionFormValues } from "@/lib/form-schemas";

export type ResubmissionField = {
  key: string;
  label: string;
  helpText: string | null;
  type:
    | "text"
    | "textarea"
    | "number"
    | "select"
    | "multiselect"
    | "checkbox"
    | "date"
    | "url";
  required: boolean;
  options: string[] | null;
};

export const RESUBMISSION_FIELD_CLASS =
  "ds-field-control mt-1 block min-h-11 w-full rounded-xl border border-[#9A8175] bg-white px-3.5 py-2.5 text-base text-ceda-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-burgundy";

export function ResubmissionFieldControl({
  field,
  register,
  error,
}: {
  field: ResubmissionField;
  register: UseFormRegister<ResubmissionFormValues>;
  error?: string;
}) {
  const id = `answer-${field.key}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [field.helpText ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ") ||
    undefined;
  const registration = register(
    `answers.${field.key}` as Path<ResubmissionFormValues>,
  );

  if (field.type === "checkbox") {
    return (
      <div>
        <label
          htmlFor={id}
          className="flex items-start gap-3 text-sm leading-6 text-ceda-body"
        >
          <input
            id={id}
            type="checkbox"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={describedBy}
            className="mt-1 h-5 w-5 accent-ceda-burgundy"
            {...registration}
          />
          <span className="font-semibold text-ceda-ink">
            {field.label}
            {field.required ? " *" : ""}
          </span>
        </label>
        {field.helpText ? (
          <p id={hintId} className="mt-1 text-sm text-ceda-muted">
            {field.helpText}
          </p>
        ) : null}
        <FieldErrorMessage id={errorId} message={error} />
      </div>
    );
  }

  const isInlineRadio =
    field.type === "select" && Boolean(field.options && field.options.length <= 5);
  const showTopLabel = !isInlineRadio && field.type !== "multiselect";

  return (
    <div>
      {showTopLabel ? (
        <label htmlFor={id} className="block text-sm font-semibold text-ceda-ink">
          {field.label}
          {field.required ? " *" : ""}
        </label>
      ) : null}

      {field.helpText ? (
        <p id={hintId} className="mt-1 text-sm text-ceda-muted">
          {field.helpText}
        </p>
      ) : null}

      {field.type === "textarea" ? (
        <textarea
          id={id}
          maxLength={4000}
          rows={4}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          className={RESUBMISSION_FIELD_CLASS}
          {...registration}
        />
      ) : null}
      {field.type === "text" ? (
        <input
          id={id}
          type="text"
          maxLength={4000}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          className={RESUBMISSION_FIELD_CLASS}
          {...registration}
        />
      ) : null}
      {field.type === "number" ? (
        <input
          id={id}
          type="number"
          step="any"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          className={RESUBMISSION_FIELD_CLASS}
          {...registration}
        />
      ) : null}
      {field.type === "date" ? (
        <input
          id={id}
          type="date"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          className={RESUBMISSION_FIELD_CLASS}
          {...registration}
        />
      ) : null}
      {field.type === "url" ? (
        <input
          id={id}
          type="url"
          inputMode="url"
          maxLength={4000}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          className={RESUBMISSION_FIELD_CLASS}
          {...registration}
        />
      ) : null}
      {field.type === "select" && field.options && field.options.length > 5 ? (
        <select
          id={id}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          className={RESUBMISSION_FIELD_CLASS}
          {...registration}
        >
          <option value="" disabled>
            Select an option
          </option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : null}
      {isInlineRadio && field.options ? (
        <fieldset
          role="radiogroup"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          aria-required={field.required}
          className="mt-2 space-y-1"
        >
          <legend className="mb-1 text-sm font-semibold text-ceda-ink">
            {field.label}
            {field.required ? " *" : ""}
          </legend>
          {field.options.map((option) => (
            <label
              key={option}
              className="flex min-h-10 items-center gap-3 text-sm text-ceda-body"
            >
              <input
                type="radio"
                value={option}
                className="h-5 w-5 accent-ceda-burgundy"
                {...registration}
              />
              {option}
            </label>
          ))}
        </fieldset>
      ) : null}
      {field.type === "multiselect" && field.options?.length ? (
        <fieldset
          aria-describedby={describedBy}
          aria-required={field.required}
          className="mt-2 space-y-1"
        >
          <legend className="mb-1 text-sm font-semibold text-ceda-ink">
            {field.label}
            {field.required ? " *" : ""}
          </legend>
          {field.options.map((option) => (
            <label
              key={option}
              className="flex min-h-10 items-center gap-3 text-sm text-ceda-body"
            >
              <input
                type="checkbox"
                value={option}
                aria-invalid={error ? "true" : "false"}
                className="h-5 w-5 accent-ceda-burgundy"
                {...registration}
              />
              {option}
            </label>
          ))}
        </fieldset>
      ) : null}

      <FieldErrorMessage id={errorId} message={error} />
    </div>
  );
}
