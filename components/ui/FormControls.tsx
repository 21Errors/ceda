"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useId, useState, useSyncExternalStore } from "react";
import { AlertCircle, UploadCloud } from "lucide-react";
import { cn } from "@/lib/cn";

const emptySubscribe = () => () => {};

function useNeedsSwitchFallback(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => typeof HTMLInputElement !== "undefined" && !("switch" in HTMLInputElement.prototype),
    () => true,
  );
}

export interface FormFieldProps {
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (controlProps: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid": "true" | "false";
    "data-error"?: string;
  }) => ReactNode;
}

/**
 * Accessible field wrapper that places hints ABOVE the input so autocomplete
 * popovers and mobile keyboards never obscure formatting rules, and links the
 * error message in `aria-describedby` only while an error is actively shown.
 */
export function FormField({
  id: providedId,
  label,
  hint,
  error,
  required = false,
  className,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = `${id}-error`;
  const hasError = Boolean(error);

  const describedBy = [hintId, hasError ? errorId : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-field", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ceda-ink">
        {label}
        {required ? (
          <span className="ms-1 text-ceda-burgundy" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {hint ? (
        <span id={hintId} className="text-xs leading-5 text-ceda-muted">
          {hint}
        </span>
      ) : null}

      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": hasError ? "true" : "false",
        "data-error": errorId,
      })}

      {hasError ? (
        <p
          id={errorId}
          className="mt-0.5 flex items-start gap-1.5 text-xs font-medium text-(--status-danger-ink)"
        >
          <span role="img" aria-label="Error" className="mt-0.5 inline-flex shrink-0">
            <AlertCircle aria-hidden="true" className="h-3.5 w-3.5 text-(--status-danger-border)" />
          </span>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  showValidState?: boolean;
  invalid?: boolean;
  onValidationChange?: (message: string | null) => void;
}

export function Input({
  showValidState = false,
  invalid = false,
  onValidationChange,
  onBlur,
  onInput,
  onInvalid,
  className,
  "aria-invalid": ariaInvalidProp,
  ...props
}: InputProps) {
  const [interactedInvalid, setInteractedInvalid] = useState(false);

  const syncValidity = (target: HTMLInputElement, forceShow: boolean) => {
    const valid = target.validity.valid;
    if (forceShow || interactedInvalid) {
      setInteractedInvalid(!valid);
      onValidationChange?.(valid ? null : target.validationMessage || "Please check this field.");
    }
  };

  const isInvalid = invalid || interactedInvalid || ariaInvalidProp === "true" || ariaInvalidProp === true;

  return (
    <input
      {...props}
      aria-invalid={isInvalid ? "true" : "false"}
      data-user-invalid={isInvalid ? "true" : undefined}
      data-show-valid={showValidState ? "true" : undefined}
      onBlur={(event) => {
        if (event.currentTarget.value.length > 0 || event.currentTarget.required) {
          syncValidity(event.currentTarget, event.currentTarget.value.length > 0);
        }
        onBlur?.(event);
      }}
      onInput={(event) => {
        if (interactedInvalid) {
          syncValidity(event.currentTarget, true);
        }
        onInput?.(event);
      }}
      onInvalid={(event) => {
        syncValidity(event.currentTarget, true);
        onInvalid?.(event);
      }}
      className={cn("ds-input", className)}
    />
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({
  invalid = false,
  rows = 4,
  className,
  "aria-invalid": ariaInvalidProp,
  ...props
}: TextareaProps) {
  const isInvalid = invalid || ariaInvalidProp === "true" || ariaInvalidProp === true;
  return (
    <textarea
      {...props}
      rows={rows}
      aria-invalid={isInvalid ? "true" : "false"}
      data-user-invalid={isInvalid ? "true" : undefined}
      className={cn("ds-input min-h-28 resize-y", className)}
    />
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({
  invalid = false,
  className,
  children,
  "aria-invalid": ariaInvalidProp,
  ...props
}: SelectProps) {
  const isInvalid = invalid || ariaInvalidProp === "true" || ariaInvalidProp === true;
  return (
    <select
      {...props}
      aria-invalid={isInvalid ? "true" : "false"}
      data-user-invalid={isInvalid ? "true" : undefined}
      className={cn("ds-input ds-select bg-white", className)}
    >
      {children}
    </select>
  );
}

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: string;
}

export function Checkbox({ id: providedId, label, description, className, ...props }: CheckboxProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-ds-3 rounded-control p-ds-2 text-sm text-ceda-body transition hover:bg-ceda-cream/60",
        props.disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded accent-ceda-burgundy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
        {...props}
      />
      <span className="min-w-0">
        <span className="block font-semibold text-ceda-ink">{label}</span>
        {description ? <span className="mt-0.5 block text-xs leading-5 text-ceda-muted">{description}</span> : null}
      </span>
    </label>
  );
}

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

/**
 * Uses the native HTML `switch` attribute on `<input type="checkbox" switch>`
 * (Safari 17.4+) with an accessible `role="switch"` + styled track/thumb
 * fallback in browsers that do not yet implement `HTMLInputElement.prototype.switch`.
 */
export function Switch({
  id: providedId,
  label,
  description,
  checked,
  defaultChecked,
  className,
  ...props
}: SwitchProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const needsFallback = useNeedsSwitchFallback();

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-11 cursor-pointer items-center justify-between gap-ds-4 rounded-control border border-ceda-line bg-white px-ds-4 py-ds-3 transition hover:border-ceda-burgundy/35 hover:bg-ceda-cream/40",
        props.disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ceda-ink">{label}</span>
        {description ? <span className="mt-0.5 block text-xs leading-5 text-ceda-muted">{description}</span> : null}
      </span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        role={needsFallback ? "switch" : undefined}
        data-switch-fallback={needsFallback ? "true" : undefined}
        className="ds-switch"
        {...({ switch: "" } as Record<string, string>)}
        {...props}
      />
    </label>
  );
}

export interface FileDropzoneProps {
  label: string;
  hint: string;
  accept?: string;
  onFileSelect?: (files: FileList | null) => void;
  selectedFileName?: string | null;
  className?: string;
}

export function FileDropzone({
  label,
  hint,
  accept,
  onFileSelect,
  selectedFileName,
  className,
}: FileDropzoneProps) {
  const id = useId();

  return (
    <div className={cn("flex flex-col gap-field", className)}>
      <span className="text-sm font-semibold text-ceda-ink">{label}</span>
      <span className="text-xs leading-5 text-ceda-muted">{hint}</span>
      <label
        htmlFor={id}
        className="group flex cursor-pointer flex-col items-center justify-center gap-ds-2 rounded-card border-2 border-dashed border-ceda-line bg-ceda-cream/40 px-card py-ds-8 text-center transition hover:border-ceda-burgundy/50 hover:bg-ceda-cream focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-ceda-orange"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ceda-cream-mid text-ceda-burgundy transition group-hover:scale-105">
          <UploadCloud aria-hidden="true" className="h-6 w-6" />
        </span>
        <span className="text-sm font-bold text-ceda-ink">
          {selectedFileName ? selectedFileName : "Choose a file or drop it here"}
        </span>
        <span className="text-xs text-ceda-muted">
          {selectedFileName ? "Click to replace selected document" : "Scanned & encrypted via Neon Object Storage"}
        </span>
        <input
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => onFileSelect?.(event.currentTarget.files)}
        />
      </label>
    </div>
  );
}
