import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";

export function TrackSignInGate({ normalizedRef }: { normalizedRef: string }) {
  const loginNext = normalizedRef
    ? `/track?ref=${encodeURIComponent(normalizedRef)}`
    : "/track";

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#F7F8F9] px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
          CEDA Innovation Portal
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ceda-ink sm:text-4xl">
          Track a Submission
        </h1>
        <p className="mt-3 text-sm leading-6 text-ceda-muted">
          Check live stage progress, review timeline milestones, and manage free
          status alerts using your CEDA reference number.
        </p>

        <section
          aria-labelledby="track-signin-heading"
          className="mt-8 rounded-2xl border border-ceda-line bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ceda-cream-mid text-ceda-burgundy">
              <Lock aria-hidden="true" className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h2
                id="track-signin-heading"
                className="text-xl font-bold text-ceda-ink"
              >
                Sign in to look up a submission
              </h2>
              <p className="mt-2 text-sm leading-6 text-ceda-body">
                To protect applicant privacy under Botswana&apos;s Data Protection
                Act 2024, submission records and lifecycle status updates are only
                shown to authenticated owners and authorized reviewers.
              </p>
              {normalizedRef && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-ceda-cream px-3 py-1 text-xs font-semibold text-ceda-burgundy">
                  Reference queued: {normalizedRef}
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={`/login?next=${encodeURIComponent(loginNext)}`}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white transition hover:bg-ceda-burgundy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                >
                  Sign in to track
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex min-h-12 items-center rounded-full border border-ceda-line bg-white px-5 text-sm font-semibold text-ceda-burgundy transition hover:bg-ceda-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                >
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
