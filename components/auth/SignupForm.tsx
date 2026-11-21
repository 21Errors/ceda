"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import {
  otpVerifySchema,
  signupFormSchema,
  type OtpVerifyFormValues,
  type SignupFormValues,
} from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { PasswordInput } from "@/components/auth/PasswordInput";
import {
  FieldErrorMessage,
  FormErrorAnnouncer,
} from "@/components/ui/FormErrorFeedback";

type Feedback = { kind: "error" | "success"; text: string } | null;

export function SignupForm() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pending, setPending] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState<boolean | null>(null);

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { name: "", email: "", password: "", consent: false },
  });

  const otpForm = useForm<OtpVerifyFormValues>({
    resolver: zodResolver(otpVerifySchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    const credentialApi = window.PublicKeyCredential as typeof window.PublicKeyCredential & {
      getClientCapabilities?: () => Promise<Record<string, boolean>>;
    };
    const capabilityCheck: Promise<Record<string, boolean>> =
      window.isSecureContext && credentialApi?.getClientCapabilities
        ? credentialApi.getClientCapabilities()
        : Promise.resolve({});
    void capabilityCheck
      .then((capabilities) => {
        setPasskeyAvailable(
          Boolean(
            capabilities["passkeyPlatformAuthenticator"] &&
              capabilities["conditionalGet"],
          ),
        );
      })
      .catch(() => setPasskeyAvailable(false));
  }, []);

  async function createPasskey() {
    setPending(true);
    setFeedback(null);
    try {
      const result = await authClient.passkey.addPasskey({
        name: "CEDA Innovation Portal",
        createSession: true,
      });
      setPending(false);
      if (result.error) {
        setFeedback({
          kind: "error",
          text:
            result.error.message ??
            "We could not set up your passkey. You can still continue with your password.",
        });
        return;
      }
    } catch (error) {
      setPending(false);
      setFeedback({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Passkey setup was not completed. You can still continue with your password.",
      });
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function onSignup(values: SignupFormValues) {
    setPending(true);
    setFeedback(null);
    const email = values.email.trim().toLowerCase();
    const response = await fetch("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: values.name.trim(),
        email,
        password: values.password,
        dataProtectionConsent: values.consent,
      }),
    }).catch(() => null);
    const result = await response?.json().catch(() => null);
    setPending(false);
    if (!response?.ok) {
      if (response?.status === 422) {
        setEmailForVerification(email);
        setFeedback({
          kind: "success",
          text: "An account already exists for this email. Enter its verification code, or request a new code below.",
        });
        return;
      }
      setFeedback({
        kind: "error",
        text:
          result?.message ??
          result?.error?.message ??
          "We could not create your account. Check the details and try again.",
      });
      return;
    }
    setEmailForVerification(email);
    setFeedback({
      kind: "success",
      text: "Enter the six-digit code sent to your email to continue.",
    });
  }

  async function onVerify(values: OtpVerifyFormValues) {
    setPending(true);
    setFeedback(null);
    const response = await fetch("/api/auth/email-otp/verify-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: emailForVerification,
        otp: values.otp.trim(),
      }),
    }).catch(() => null);
    const result = await response?.json().catch(() => null);
    setPending(false);
    if (!response?.ok) {
      setFeedback({
        kind: "error",
        text:
          result?.message ??
          result?.error?.message ??
          "That code could not be verified. Check it and try again.",
      });
      return;
    }
    setEmailVerified(true);
    setFeedback({
      kind: "success",
      text: "Email verified. Set up a passkey for faster sign-in, or continue to your account.",
    });
  }

  const signupErrors = signupForm.formState.errors;
  const otpErrors = otpForm.formState.errors;

  return (
    <section className="auth-card">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
        Submitter account
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ceda-ink">
        Create your account
      </h1>
      <p className="mt-3 text-sm leading-6 text-ceda-muted">
        Use an email address you can access. We’ll send a one-time code to verify it.
      </p>
      {feedback ? (
        <p
          className={`auth-feedback ${feedback.kind}`}
          role="status"
          aria-live="polite"
        >
          {feedback.text}
        </p>
      ) : null}

      {emailVerified ? (
        <div className="mt-6 space-y-4">
          <button
            className="auth-primary"
            type="button"
            onClick={createPasskey}
            disabled={pending || passkeyAvailable !== true}
          >
            {pending
              ? "Setting up passkey..."
              : passkeyAvailable === null
                ? "Checking passkey support..."
                : "Set up a passkey"}
          </button>
          <p className="text-sm leading-6 text-ceda-muted">
            A passkey lets you sign in with your device&apos;s fingerprint, face
            recognition or screen lock. You can add one later after signing in.
          </p>
          {passkeyAvailable === false ? (
            <p className="text-sm leading-6 text-ceda-muted" role="status">
              This browser or device cannot create a passkey here. Continue with
              your password instead.
            </p>
          ) : null}
          <button
            className="auth-secondary w-full"
            type="button"
            onClick={() => {
              router.push("/dashboard");
              router.refresh();
            }}
          >
            Continue without a passkey
          </button>
        </div>
      ) : emailForVerification ? (
        <>
          <FormErrorAnnouncer
            errors={otpErrors}
            submitCount={otpForm.formState.submitCount}
          />
          <form
            noValidate
            className="mt-6 space-y-4"
            onSubmit={otpForm.handleSubmit(onVerify)}
            aria-labelledby="verify-heading"
          >
            <h2 id="verify-heading" className="font-semibold text-ceda-ink">
              Verify {emailForVerification}
            </h2>
            <div className="auth-field">
              <label htmlFor="otp">Six-digit email code</label>
              <span id="otp-help">The code expires after five minutes.</span>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                aria-invalid={otpErrors.otp ? "true" : "false"}
                aria-describedby={
                  otpErrors.otp ? "otp-help otp-error" : "otp-help"
                }
                {...otpForm.register("otp")}
              />
              <FieldErrorMessage
                id="otp-error"
                message={otpErrors.otp?.message}
              />
            </div>
            <button className="auth-primary" type="submit" disabled={pending}>
              {pending ? "Verifying…" : "Verify email"}
            </button>
            <p className="text-sm text-ceda-muted">
              If you already verified this account,{" "}
              <Link
                className="font-semibold text-ceda-burgundy underline underline-offset-4"
                href="/login"
              >
                sign in
              </Link>
              .
            </p>
            <button
              className="auth-secondary"
              type="button"
              onClick={async () => {
                setPending(true);
                const response = await fetch(
                  "/api/auth/email-otp/send-verification-otp",
                  {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      email: emailForVerification,
                      type: "email-verification",
                    }),
                  },
                ).catch(() => null);
                setPending(false);
                setFeedback(
                  response?.ok
                    ? { kind: "success", text: "A new code has been sent." }
                    : {
                        kind: "error",
                        text: "We could not resend the code. Please try again shortly.",
                      },
                );
              }}
              disabled={pending}
            >
              Resend code
            </button>
          </form>
        </>
      ) : (
        <>
          <FormErrorAnnouncer
            errors={signupErrors}
            submitCount={signupForm.formState.submitCount}
          />
          <form
            noValidate
            id="signup-details"
            className="mt-6 space-y-4"
            onSubmit={signupForm.handleSubmit(onSignup)}
            aria-labelledby="signup-heading"
          >
            <h2 id="signup-heading" className="sr-only">
              Registration details
            </h2>
            <div className="auth-field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                autoComplete="name"
                maxLength={120}
                aria-invalid={signupErrors.name ? "true" : "false"}
                aria-describedby={signupErrors.name ? "name-error" : undefined}
                {...signupForm.register("name")}
              />
              <FieldErrorMessage
                id="name-error"
                message={signupErrors.name?.message}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                maxLength={255}
                aria-invalid={signupErrors.email ? "true" : "false"}
                aria-describedby={signupErrors.email ? "email-error" : undefined}
                {...signupForm.register("email")}
              />
              <FieldErrorMessage
                id="email-error"
                message={signupErrors.email?.message}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <span id="password-help">Use at least 12 characters.</span>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                maxLength={128}
                aria-invalid={signupErrors.password ? "true" : "false"}
                aria-describedby={
                  signupErrors.password
                    ? "password-help password-error"
                    : "password-help"
                }
                {...signupForm.register("password")}
              />
              <FieldErrorMessage
                id="password-error"
                message={signupErrors.password?.message}
              />
            </div>
            <div>
              <label className="auth-consent">
                <input
                  id="signup-consent"
                  type="checkbox"
                  aria-invalid={signupErrors.consent ? "true" : "false"}
                  aria-describedby={
                    signupErrors.consent ? "consent-error" : undefined
                  }
                  {...signupForm.register("consent")}
                />
                <span>
                  I have read the <Link href="/privacy">privacy notice</Link> and
                  consent to the processing of my information under Botswana’s
                  Data Protection Act 2024.
                </span>
              </label>
              <FieldErrorMessage
                id="consent-error"
                message={signupErrors.consent?.message}
              />
            </div>
            <button className="auth-primary" type="submit" disabled={pending}>
              {pending ? "Creating account…" : "Create account"}
            </button>
          </form>
        </>
      )}

      {!emailForVerification ? (
        <>
          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-ceda-muted">
            <span className="h-px flex-1 bg-ceda-line" />
            or
            <span className="h-px flex-1 bg-ceda-line" />
          </div>
          <SocialAuthButtons />
        </>
      ) : null}

      <p className="mt-6 text-sm text-ceda-muted">
        Already registered?{" "}
        <Link
          className="font-semibold text-ceda-burgundy underline underline-offset-4"
          href="/login"
        >
          Sign in
        </Link>
      </p>
    </section>
  );
}
