"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FieldErrors, FieldValues } from "react-hook-form";

function collectErrorMessages(
  errors: Record<string, unknown>,
  prefix = "",
): Array<{ key: string; message: string }> {
  const result: Array<{ key: string; message: string }> = [];
  for (const [key, value] of Object.entries(errors)) {
    if (!value || typeof value !== "object") continue;
    const record = value as Record<string, unknown>;
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof record.message === "string" && record.message.trim()) {
      result.push({ key: fullKey, message: record.message });
    } else {
      result.push(...collectErrorMessages(record, fullKey));
    }
  }
  return result;
}

/**
 * Single polite live region that announces newly surfaced field errors a moment
 * after blur so screen readers finish announcing the next focused control first.
 */
export function FormErrorAnnouncer<TFieldValues extends FieldValues>({
  errors,
  submitCount,
}: {
  errors: FieldErrors<TFieldValues>;
  submitCount: number;
}) {
  const [announcement, setAnnouncement] = useState("");
  const prevKeysRef = useRef<Set<string>>(new Set());
  const prevSubmitCountRef = useRef(submitCount);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const active = collectErrorMessages(errors as Record<string, unknown>);
    const nextKeys = new Set(active.map((entry) => entry.key));
    const newlyAdded = active.filter((entry) => !prevKeysRef.current.has(entry.key));
    const wasSubmit = submitCount !== prevSubmitCountRef.current;

    prevKeysRef.current = nextKeys;
    prevSubmitCountRef.current = submitCount;

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (active.length === 0) {
      timerRef.current = window.setTimeout(() => setAnnouncement(""), 0);
      return;
    }

    // On failed submit, react-hook-form moves focus to the first invalid field, which reads its error.
    if (wasSubmit || newlyAdded.length === 0) {
      return;
    }

    const latest = newlyAdded[newlyAdded.length - 1];
    timerRef.current = window.setTimeout(() => {
      setAnnouncement(`Error: ${latest.message}`);
    }, 450);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [errors, submitCount]);

  return (
    <div aria-live="polite" aria-atomic="true" className="visually-hidden">
      {announcement}
    </div>
  );
}

/**
 * Visible inline field error paired with an accessible "Error" icon so validation
 * feedback is never conveyed by color alone. Link its `id` in `aria-describedby`
 * only while `message` is truthy.
 */
export function FieldErrorMessage({
  id,
  message,
  className = "",
}: {
  id: string;
  message?: string;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p
      id={id}
      className={`mt-1 flex items-start gap-1.5 text-xs font-medium leading-5 text-(--status-danger-ink) ${className}`}
    >
      <span
        role="img"
        aria-label="Error"
        className="mt-0.5 inline-flex shrink-0"
      >
        <AlertCircle
          aria-hidden="true"
          className="h-3.5 w-3.5 text-(--status-danger-border)"
        />
      </span>
      <span>{message}</span>
    </p>
  );
}
