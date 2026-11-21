import type { FieldError, FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { z } from "zod";

function setNestedError(
  target: Record<string, unknown>,
  path: readonly PropertyKey[],
  error: FieldError,
) {
  if (path.length === 0) {
    if (!target.root) {
      target.root = error;
    }
    return;
  }

  let current: Record<string, unknown> = target;
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = String(path[i]);
    const next = current[key];
    if (!next || typeof next !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  const leafKey = String(path[path.length - 1]);
  if (!current[leafKey]) {
    current[leafKey] = error;
  }
}

/**
 * Lightweight Zod v4 resolver for react-hook-form v7.
 * Preserves nested paths (e.g., dynamic answers or criterion scores) and keeps
 * the first issue per field so blur/change errors stay concise and actionable.
 */
export function zodResolver<TFieldValues extends FieldValues>(
  schema: z.ZodType<TFieldValues>,
): Resolver<TFieldValues> {
  return async (values) => {
    const parsed = schema.safeParse(values);
    if (parsed.success) {
      return {
        values: parsed.data,
        errors: {} as Record<string, never>,
      };
    }

    const errors: Record<string, unknown> = {};
    for (const issue of parsed.error.issues) {
      setNestedError(errors, issue.path, {
        type: issue.code,
        message: issue.message,
      });
    }

    return {
      values: {} as Record<string, never>,
      errors: errors as FieldErrors<TFieldValues>,
    };
  };
}
