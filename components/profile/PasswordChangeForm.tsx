"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { PasswordInput } from "@/components/auth/PasswordInput";
import {
  FieldErrorMessage,
  FormErrorAnnouncer,
} from "@/components/ui/FormErrorFeedback";
import {
  passwordChangeSchema,
  type PasswordChangeFormValues,
} from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";

const fieldClass =
  "ds-field-control mt-2 block min-h-12 w-full rounded-xl border border-[#9A8175] bg-white px-3.5 py-3 text-base text-ceda-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ceda-burgundy";

export function PasswordChangeForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, submitCount },
  } = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: PasswordChangeFormValues) {
    setMessage("");
    setError(false);
    setPending(true);
    try {
      const result = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        setError(true);
        setMessage(
          result.error.message ||
            "Your password could not be changed. Check your current password and try again.",
        );
        return;
      }
      setMessage("Password changed. Other sessions have been signed out.");
      reset();
    } catch {
      setError(true);
      setMessage(
        "Your password could not be changed right now. Check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <FormErrorAnnouncer errors={errors} submitCount={submitCount} />
      <form
        noValidate
        id="password-change-form"
        onSubmit={handleSubmit(onSubmit)}
        aria-labelledby="password-heading"
        className="space-y-5"
      >
        <h2 id="password-heading" className="text-xl font-bold text-ceda-ink">
          Change password
        </h2>
        <div>
          <label
            htmlFor="currentPassword"
            className="text-sm font-semibold text-ceda-ink"
          >
            Current password
          </label>
          <PasswordInput
            id="currentPassword"
            autoComplete="current-password"
            aria-invalid={errors.currentPassword ? "true" : "false"}
            aria-describedby={
              errors.currentPassword ? "current-password-error" : undefined
            }
            className={fieldClass}
            {...register("currentPassword")}
          />
          <FieldErrorMessage
            id="current-password-error"
            message={errors.currentPassword?.message}
          />
        </div>
        <div>
          <label
            htmlFor="newPassword"
            className="text-sm font-semibold text-ceda-ink"
          >
            New password
          </label>
          <p id="new-password-hint" className="mt-1 text-xs text-ceda-muted">
            Use at least 8 characters.
          </p>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            aria-invalid={errors.newPassword ? "true" : "false"}
            aria-describedby={
              errors.newPassword
                ? "new-password-hint new-password-error"
                : "new-password-hint"
            }
            className={fieldClass}
            {...register("newPassword")}
          />
          <FieldErrorMessage
            id="new-password-error"
            message={errors.newPassword?.message}
          />
        </div>
        <div>
          <label
            htmlFor="confirmPassword"
            className="text-sm font-semibold text-ceda-ink"
          >
            Confirm new password
          </label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={errors.confirmPassword ? "true" : "false"}
            aria-describedby={
              errors.confirmPassword ? "confirm-password-error" : undefined
            }
            className={fieldClass}
            {...register("confirmPassword")}
          />
          <FieldErrorMessage
            id="confirm-password-error"
            message={errors.confirmPassword?.message}
          />
        </div>
        {message ? (
          <p
            className={`rounded-xl p-3 text-sm ${
              error
                ? "border border-red-800/25 bg-red-50 text-red-900"
                : "border border-green-800/20 bg-green-50 text-green-900"
            }`}
            role={error ? "alert" : "status"}
          >
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60"
        >
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  );
}
