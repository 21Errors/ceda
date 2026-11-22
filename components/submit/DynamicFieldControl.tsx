"use client";

import type { Path, UseFormRegister } from "react-hook-form";
import { FieldErrorMessage } from "@/components/ui/FormErrorFeedback";
import type { SubmissionFormValues } from "@/lib/form-schemas";
import { SUBMISSION_INPUT_CLASS, type SubmissionField } from "./submission-config";

export function DynamicFieldControl({
  field,
  register,
  error,
}: {
  field: SubmissionField;
  register: UseFormRegister<SubmissionFormValues>;
  error?: string;
}) {
  const id = `answer-${field.key}`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [field.helpText ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;
  const fieldPath = `answers.${field.key}` as Path<SubmissionFormValues>;
  const registration = register(fieldPath);

  if (field.type === "checkbox") {
    return (
      <div>
        <label
          htmlFor={id}
          className="flex min-h-12 items-start gap-3 text-sm leading-6 text-ceda-body"
        >
          <input
            id={id}
            type="checkbox"
            aria-describedby={describedBy}
            aria-invalid={error ? "true" : "false"}
            className="mt-1 h-5 w-5 accent-ceda-burgundy"
            {...registration}
          />
          <span className="font-semibold text-ceda-ink">
            {field.label}
            {field.required ? (
              <span aria-hidden="true" className="text-ceda-burgundy">
                {" "}
                *
              </span>
            ) : null}
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

  if (field.type === "multiselect") {
    return (
      <fieldset aria-describedby={describedBy}>
        <legend className="text-sm font-semibold text-ceda-ink">
          {field.label}
          {field.required ? (
            <span aria-hidden="true" className="text-ceda-burgundy">
              {" "}
              *
            </span>
          ) : null}
        </legend>
        {field.helpText ? (
          <p id={hintId} className="mt-1 text-sm text-ceda-muted">
            {field.helpText}
          </p>
        ) : null}
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(field.options ?? []).map((option, index) => (
            <label
              key={option}
              htmlFor={`${id}-${index}`}
              className="flex min-h-12 items-center gap-3 rounded-xl border border-ceda-line bg-white px-3 text-sm text-ceda-body"
            >
              <input
                id={`${id}-${index}`}
                type="checkbox"
                value={option}
                aria-invalid={error ? "true" : "false"}
                className="h-5 w-5 accent-ceda-burgundy"
                {...registration}
              />
              {option}
            </label>
          ))}
        </div>
        <FieldErrorMessage id={errorId} message={error} />
      </fieldset>
    );
  }

  const common = {
    id,
    "aria-describedby": describedBy,
    "aria-invalid": (error ? "true" : "false") as "true" | "false",
    className: SUBMISSION_INPUT_CLASS,
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ceda-ink">
        {field.label}
        {field.required ? (
          <span aria-hidden="true" className="text-ceda-burgundy">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {field.helpText ? (
        <p id={hintId} className="mt-1 text-sm text-ceda-muted">
          {field.helpText}
        </p>
      ) : null}
      {field.type === "textarea" ? (
        <textarea {...common} rows={5} maxLength={5000} {...registration} />
      ) : null}
      {field.type === "select" ? (
        <select {...common} {...registration}>
          <option value="">Select an option</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : null}
      {field.type === "number" ? (
        <input {...common} type="number" step="any" {...registration} />
      ) : null}
      {field.type === "date" ? <input {...common} type="date" {...registration} /> : null}
      {field.type === "url" ? (
        <input
          {...common}
          type="url"
          inputMode="url"
          maxLength={4000}
          placeholder="https://"
          {...registration}
        />
      ) : null}
      {field.type === "text" ? (
        <input {...common} type="text" maxLength={4000} {...registration} />
      ) : null}
      <FieldErrorMessage id={errorId} message={error} />
    </div>
  );
}
