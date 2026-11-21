"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { PasswordInput } from "@/components/auth/PasswordInput";
import {
  FieldErrorMessage,
  FormErrorAnnouncer,
} from "@/components/ui/FormErrorFeedback";
import {
  forgotPasswordRequestSchema,
  forgotPasswordResetSchema,
  type ForgotPasswordRequestValues,
  type ForgotPasswordResetValues,
} from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";

export function ForgotPasswordForm() {
  const [targetEmail, setTargetEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const requestForm = useForm<ForgotPasswordRequestValues>({
    resolver: zodResolver(forgotPasswordRequestSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ForgotPasswordResetValues>({
    resolver: zodResolver(forgotPasswordResetSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { otp: "", password: "" },
  });

  async function onRequestCode(values: ForgotPasswordRequestValues) {
    setPending(true);
    const email = values.email.trim().toLowerCase();
    const response = await fetch("/api/auth/email-otp/request-password-reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    setPending(false);
    setTargetEmail(email);
    setSent(true);
    setMessage(
      response?.ok
        ? "If an account matches that email, a reset code has been sent."
        : "We could not send a reset code. Please try again shortly.",
    );
  }

  async function onResetPassword(values: ForgotPasswordResetValues) {
    setPending(true);
    const response = await fetch("/api/auth/email-otp/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: targetEmail,
        otp: values.otp.trim(),
        password: values.password,
      }),
    }).catch(() => null);
    const result = await response?.json().catch(() => null);
    setPending(false);
    setMessage(
      response?.ok
        ? "Your password has been changed. You can sign in now."
        : result?.message ??
            result?.error?.message ??
            "That code could not be verified. Please check it and try again.",
    );
  }

  return (
    <section className="auth-card">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
        Account recovery
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ceda-ink">
        Reset your password
      </h1>
      <p className="mt-3 text-sm leading-6 text-ceda-muted">
        We’ll send a one-time code to your account email.
      </p>
      {message ? (
        <p className="auth-feedback" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}

      <FormErrorAnnouncer
        errors={requestForm.formState.errors}
        submitCount={requestForm.formState.submitCount}
      />

      <form
        noValidate
        className="mt-6 space-y-4"
        onSubmit={requestForm.handleSubmit(onRequestCode)}
        aria-labelledby="recovery-heading"
      >
        <h2 id="recovery-heading" className="sr-only">
          Request a password reset code
        </h2>
        <div className="auth-field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={requestForm.formState.errors.email ? "true" : "false"}
            aria-describedby={
              requestForm.formState.errors.email ? "email-error" : undefined
            }
            {...requestForm.register("email")}
          />
          <FieldErrorMessage
            id="email-error"
            message={requestForm.formState.errors.email?.message}
          />
        </div>
        <button className="auth-primary" type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send reset code"}
        </button>
      </form>

      {sent ? (
        <>
          <FormErrorAnnouncer
            errors={resetForm.formState.errors}
            submitCount={resetForm.formState.submitCount}
          />
          <form
            noValidate
            className="mt-6 space-y-4 border-t border-ceda-line pt-6"
            onSubmit={resetForm.handleSubmit(onResetPassword)}
            aria-labelledby="reset-heading"
          >
            <h2 id="reset-heading" className="font-semibold text-ceda-ink">
              Choose a new password
            </h2>
            <div className="auth-field">
              <label htmlFor="otp">Six-digit reset code</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                aria-invalid={resetForm.formState.errors.otp ? "true" : "false"}
                aria-describedby={
                  resetForm.formState.errors.otp ? "otp-error" : undefined
                }
                {...resetForm.register("otp")}
              />
              <FieldErrorMessage
                id="otp-error"
                message={resetForm.formState.errors.otp?.message}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="password">New password</label>
              <span id="reset-password-help">Use at least 12 characters.</span>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                maxLength={128}
                aria-invalid={
                  resetForm.formState.errors.password ? "true" : "false"
                }
                aria-describedby={
                  resetForm.formState.errors.password
                    ? "reset-password-help reset-password-error"
                    : "reset-password-help"
                }
                {...resetForm.register("password")}
              />
              <FieldErrorMessage
                id="reset-password-error"
                message={resetForm.formState.errors.password?.message}
              />
            </div>
            <button className="auth-primary" type="submit" disabled={pending}>
              {pending ? "Updating…" : "Change password"}
            </button>
          </form>
        </>
      ) : null}
    </section>
  );
}
