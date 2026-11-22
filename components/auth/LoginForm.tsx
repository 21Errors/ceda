"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import {
  loginSchema,
  otpVerifySchema,
  type LoginFormValues,
  type OtpVerifyFormValues,
} from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { PasswordInput } from "@/components/auth/PasswordInput";
import {
  FieldErrorMessage,
  FormErrorAnnouncer,
} from "@/components/ui/FormErrorFeedback";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const otpForm = useForm<OtpVerifyFormValues>({
    resolver: zodResolver(otpVerifySchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { otp: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setPending(true);
    setError("");
    const email = values.email.trim().toLowerCase();
    const result = await authClient.signIn.email({
      email,
      password: values.password,
      callbackURL: "/dashboard",
    });
    setPending(false);
    if (result.error) {
      const errorCode = (result.error as { code?: string }).code;
      if (
        errorCode === "EMAIL_NOT_VERIFIED" ||
        result.error.message?.toLowerCase() === "email not verified"
      ) {
        setUnverifiedEmail(email);
        setError(
          "Your email needs verification. We sent a new six-digit code; enter it below.",
        );
        return;
      }
      if (errorCode === "INVALID_EMAIL_OR_PASSWORD") {
        setError(
          "The email and password did not match. If you used this email in an earlier signup attempt, use Forgot password to set a new password; trying signup again does not change an existing password.",
        );
        return;
      }
      setError(
        result.error.message ?? "Sign in failed. Check your details and try again.",
      );
      return;
    }
    const next = params.get("next");
    router.push(
      next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard",
    );
    router.refresh();
  }

  async function signInWithPasskey() {
    setPending(true);
    setError("");
    const result = await authClient.signIn.passkey({ autoFill: false });
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Passkey sign-in was not completed.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function onVerifyEmail(values: OtpVerifyFormValues) {
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/email-otp/verify-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: unverifiedEmail, otp: values.otp.trim() }),
    }).catch(() => null);
    const result = await response?.json().catch(() => null);
    setPending(false);
    if (!response?.ok) {
      setError(
        result?.message ??
          result?.error?.message ??
          "That code could not be verified. Request a fresh one and try again.",
      );
      return;
    }
    const next = params.get("next");
    router.push(
      next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard",
    );
    router.refresh();
  }

  async function resendVerificationCode() {
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/email-otp/send-verification-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: unverifiedEmail,
        type: "email-verification",
      }),
    }).catch(() => null);
    setPending(false);
    setError(
      response?.ok
        ? "A fresh verification code has been sent."
        : "We could not resend the code. Please try again shortly.",
    );
  }

  return (
    <section className="auth-card">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
        CEDA Innovation Portal
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ceda-ink">
        Sign in
      </h1>
      <p className="mt-3 text-sm leading-6 text-ceda-muted">
        Access your ideas, feedback and notifications.
      </p>
      {error ? (
        <p className="auth-feedback error" role="alert">
          {error}
        </p>
      ) : null}

      <FormErrorAnnouncer errors={errors} submitCount={submitCount} />

      <form
        noValidate
        className="mt-6 space-y-4"
        onSubmit={handleSubmit(onSubmit)}
        aria-labelledby="login-heading"
      >
        <h2 id="login-heading" className="sr-only">
          Sign-in details
        </h2>
        <div className="auth-field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          <FieldErrorMessage id="email-error" message={errors.email?.message} />
        </div>
        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? "true" : "false"}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <FieldErrorMessage
            id="password-error"
            message={errors.password?.message}
          />
        </div>
        <div className="text-right">
          <Link
            className="text-sm font-semibold text-ceda-burgundy underline underline-offset-4"
            href="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>
        <button className="auth-primary" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {unverifiedEmail ? (
        <>
          <FormErrorAnnouncer
            errors={otpForm.formState.errors}
            submitCount={otpForm.formState.submitCount}
          />
          <form
            noValidate
            className="mt-6 space-y-4 rounded-xl border border-ceda-line bg-[#FFF9F4] p-4"
            onSubmit={otpForm.handleSubmit(onVerifyEmail)}
            aria-labelledby="login-verify-heading"
          >
            <h2 id="login-verify-heading" className="font-semibold text-ceda-ink">
              Verify {unverifiedEmail}
            </h2>
            <div className="auth-field">
              <label htmlFor="login-otp">Six-digit email code</label>
              <input
                id="login-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                aria-invalid={otpForm.formState.errors.otp ? "true" : "false"}
                aria-describedby={
                  otpForm.formState.errors.otp ? "login-otp-error" : undefined
                }
                {...otpForm.register("otp")}
              />
              <FieldErrorMessage
                id="login-otp-error"
                message={otpForm.formState.errors.otp?.message}
              />
            </div>
            <button className="auth-primary" type="submit" disabled={pending}>
              {pending ? "Verifying…" : "Verify and sign in"}
            </button>
            <button
              className="auth-secondary w-full"
              type="button"
              onClick={resendVerificationCode}
              disabled={pending}
            >
              Resend code
            </button>
          </form>
        </>
      ) : null}

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-ceda-muted">
        <span className="h-px flex-1 bg-ceda-line" />
        or
        <span className="h-px flex-1 bg-ceda-line" />
      </div>
      <SocialAuthButtons />
      <button
        className="auth-secondary mt-3 w-full"
        type="button"
        onClick={signInWithPasskey}
        disabled={pending}
      >
        {pending ? "Waiting for passkey…" : "Sign in with a passkey"}
      </button>
      <p className="mt-6 text-sm text-ceda-muted">
        New to the portal?{" "}
        <Link
          className="font-semibold text-ceda-burgundy underline underline-offset-4"
          href="/signup"
        >
          Create an account
        </Link>
      </p>
    </section>
  );
}
