import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  Bell,
  BellOff,
  CheckCircle2,
  Clock3,
  FileSearch,
  Lock,
  Search,
  Settings,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { PipelineStepper } from "@/components/ui/PipelineStepper";
import { StatusBadge } from "@/components/ui/Badge";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { getCurrentSession, getUserRoles } from "@/lib/authorization";
import {
  getTrackableUserSubmissions,
  getUserAlertChannelSummary,
  lookupTrackedSubmission,
} from "@/lib/server/track-submission";
import {
  getTrackingNextStep,
  isValidReferenceFormat,
  mapIdeaToPipelineStage,
  normalizeReferenceInput,
} from "@/lib/track-pipeline";
import { toggleTrackedIdeaAlert } from "./actions";

export default function TrackPage({ searchParams }: PageProps<"/track">) {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="detail" />}>
      <TrackContent searchParams={searchParams} />
    </Suspense>
  );
}

async function TrackContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [session, query] = await Promise.all([
    getCurrentSession(),
    searchParams,
  ]);

  const rawRefParam = Array.isArray(query.ref) ? query.ref[0] : query.ref;
  const normalizedRef = rawRefParam ? normalizeReferenceInput(rawRefParam) : "";
  const alertNotice = Array.isArray(query.alert) ? query.alert[0] : query.alert;
  const errorNotice = Array.isArray(query.error) ? query.error[0] : query.error;

  if (!session?.user) {
    const loginNext = normalizedRef
      ? `/track?ref=${encodeURIComponent(normalizedRef)}`
      : "/track";

    return (
      <main
        id="main-content"
        className="flex-1 bg-[#F7F8F9] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
            CEDA Innovation Portal
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ceda-ink sm:text-4xl">
            Track a Submission
          </h1>
          <p className="mt-3 text-sm leading-6 text-ceda-muted">
            Check live stage progress, review timeline milestones, and manage
            free status alerts using your CEDA reference number.
          </p>

          <section
            aria-labelledby="track-signin-heading"
            className="mt-8 rounded-2xl border border-ceda-line bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ceda-cream-mid text-ceda-burgundy">
                <Lock aria-hidden="true" className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h2
                  id="track-signin-heading"
                  className="text-xl font-bold text-ceda-ink">
                  Sign in to look up a submission
                </h2>
                <p className="mt-2 text-sm leading-6 text-ceda-body">
                  To protect applicant privacy under Botswana&apos;s Data
                  Protection Act 2024, submission records and lifecycle status
                  updates are only shown to authenticated owners and authorized
                  reviewers.
                </p>
                {normalizedRef && (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-ceda-cream px-3 py-1 text-xs font-semibold text-ceda-burgundy">
                    Reference queued: {normalizedRef}
                  </p>
                )}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/login?next=${encodeURIComponent(loginNext)}`}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white transition hover:bg-ceda-burgundy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                    Sign in to track
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex min-h-12 items-center rounded-full border border-ceda-line bg-white px-5 text-sm font-semibold text-ceda-burgundy transition hover:bg-ceda-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
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

  const user = session.user;
  const roles = await getUserRoles(user.id);
  const hasValidFormat = normalizedRef
    ? isValidReferenceFormat(normalizedRef)
    : false;

  const [tracked, userSubmissions, channels] = await Promise.all([
    normalizedRef && hasValidFormat
      ? lookupTrackedSubmission(normalizedRef, user.id, roles)
      : Promise.resolve(null),
    getTrackableUserSubmissions(user.id),
    getUserAlertChannelSummary(user.id),
  ]);

  const pipelineState = tracked
    ? mapIdeaToPipelineStage(tracked.status, tracked.stageType)
    : null;
  const nextStep = tracked
    ? getTrackingNextStep(tracked.status, tracked.stageName)
    : null;
  const isCommitteeMember = roles.includes("committee_member");

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#F7F8F9] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
              Live status tracker
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ceda-ink sm:text-4xl">
              Track a Submission
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ceda-muted">
              Enter your CEDA reference number to inspect live pipeline
              progress, stage history, and free status alert subscriptions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isCommitteeMember && (
              <Link
                href="/committee"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ceda-line bg-white px-4 text-xs font-semibold text-ceda-burgundy transition hover:bg-ceda-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                Committee monitor
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            )}
            <Link
              href="/notifications"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ceda-line bg-white px-4 text-xs font-semibold text-ceda-ink transition hover:bg-ceda-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
              <Bell aria-hidden="true" className="h-3.5 w-3.5 text-ceda-burgundy" />
              Notification inbox
            </Link>
          </div>
        </header>

        {/* Reference lookup form */}
        <section
          aria-labelledby="lookup-heading"
          className="mt-7 rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-7">
          <h2 id="lookup-heading" className="text-base font-bold text-ceda-ink">
            Look up by reference number
          </h2>
          <p className="mt-1 text-xs text-ceda-muted">
            Format: <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-ceda-ink">CEDA-2026-XXXXXXXX</code>{" "}
            (case-insensitive).
          </p>
          <form
            method="GET"
            action="/track"
            role="search"
            aria-label="Submission reference lookup"
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="reference-lookup"
                className="block text-sm font-semibold text-ceda-ink">
                Submission reference number
              </label>
              <div className="relative mt-1.5">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ceda-muted"
                />
                <input
                  id="reference-lookup"
                  name="ref"
                  type="search"
                  defaultValue={normalizedRef}
                  placeholder="CEDA-2026-A1B2C3D4"
                  autoComplete="off"
                  spellCheck={false}
                  required
                  className="ds-input pl-10 font-mono uppercase tracking-wide"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white transition hover:bg-ceda-burgundy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                <FileSearch aria-hidden="true" className="h-4 w-4" />
                Track status
              </button>
              {normalizedRef && (
                <Link
                  href="/track"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-ceda-line bg-white px-4 text-sm font-semibold text-ceda-body transition hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                  Clear
                </Link>
              )}
            </div>
          </form>

          {normalizedRef && !hasValidFormat && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-[#B42318]/25 bg-(--status-danger-bg) px-4 py-3 text-sm text-(--status-danger-ink)">
              &ldquo;{normalizedRef}&rdquo; does not match a valid CEDA
              reference number. Expected format is{" "}
              <strong className="font-mono">CEDA-YYYY-XXXXXXXX</strong>.
            </p>
          )}

          {normalizedRef && hasValidFormat && !tracked && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-ceda-line bg-ceda-cream px-4 py-4 text-sm text-ceda-body">
              <p className="font-semibold text-ceda-ink">
                No accessible submission matched{" "}
                <span className="font-mono text-ceda-burgundy">
                  {normalizedRef}
                </span>
                .
              </p>
              <p className="mt-1 text-xs leading-5 text-ceda-muted">
                Double-check the reference number from your confirmation screen
                and make sure you are signed in with the account that submitted
                it.
              </p>
            </div>
          )}
        </section>

        {/* Alert action notices */}
        {alertNotice === "followed" && (
          <p
            role="status"
            className="mt-5 flex items-center gap-2 rounded-xl border border-[#16803C]/25 bg-(--status-success-bg) px-4 py-3 text-sm font-medium text-(--status-success-ink)">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
            Free status alerts enabled for this submission. You will be notified
            whenever its workflow stage or status changes.
          </p>
        )}
        {alertNotice === "unfollowed" && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-ceda-line bg-white px-4 py-3 text-sm text-ceda-body">
            Status alerts paused for this submission. You can re-enable alerts
            at any time.
          </p>
        )}
        {errorNotice && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-[#B42318]/25 bg-(--status-danger-bg) px-4 py-3 text-sm text-(--status-danger-ink)">
            Unable to update alert subscription for that submission. Refresh and
            try again.
          </p>
        )}

        {/* Tracked submission visual pipeline & details */}
        {tracked && pipelineState && (
          <section
            aria-labelledby="tracked-title"
            className="mt-7 space-y-6">
            {/* Hero status summary */}
            <div className="overflow-hidden rounded-2xl border border-ceda-line bg-white shadow-sm">
              <div className="bg-ceda-burgundy-dark px-6 py-6 text-white sm:px-8 sm:py-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-ceda-peach">
                      {tracked.referenceNo}
                    </p>
                    <h2
                      id="tracked-title"
                      className="mt-2 text-2xl font-bold sm:text-3xl">
                      {tracked.title ?? "Untitled submission"}
                    </h2>
                    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/80 sm:text-sm">
                      <span>{tracked.callTitle}</span>
                      {tracked.categoryName && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{tracked.categoryName}</span>
                        </>
                      )}
                      {tracked.versionNo && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Version {tracked.versionNo}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <StatusBadge
                    status={tracked.status}
                    className="bg-white/95 shadow-xs"
                  />
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-ceda-muted">
                    Lifecycle pipeline
                  </h3>
                  <span className="text-xs font-semibold text-ceda-burgundy">
                    Current stage:{" "}
                    {tracked.stageName ??
                      tracked.status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="mt-4">
                  <PipelineStepper
                    currentStage={pipelineState.currentStage}
                    changesRequested={pipelineState.changesRequested}
                  />
                </div>

                {/* Next step callout */}
                <div
                  className={`mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 sm:p-5 ${
                    tracked.status === "changes_requested"
                      ? "border-(--status-warning-border)/40 bg-(--status-warning-bg)"
                      : tracked.status === "rejected"
                        ? "border-[#B42318]/25 bg-(--status-danger-bg)"
                        : "border-ceda-line bg-ceda-cream"
                  }`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-ceda-burgundy">
                      What happens next
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ceda-ink">
                      {nextStep}
                    </p>
                  </div>

                  {tracked.isOwner && (
                    <Link
                      href={
                        tracked.status === "draft"
                          ? `/submit?draft=${tracked.id}`
                          : `/dashboard/submissions/${tracked.id}`
                      }
                      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-ceda-burgundy px-5 text-xs font-bold text-white transition hover:bg-ceda-burgundy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange sm:text-sm">
                      {tracked.status === "draft"
                        ? "Continue draft"
                        : tracked.status === "changes_requested"
                          ? "Review & resubmit"
                          : "Open full details"}
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Award recognition callout if awarded */}
            {tracked.awards.length > 0 && (
              <section
                aria-labelledby="tracked-awards-heading"
                className="rounded-2xl border border-[#E8B36D] bg-[#FFF9F0] p-6 shadow-sm sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ceda-burgundy text-white">
                    <Trophy aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <h3
                    id="tracked-awards-heading"
                    className="text-lg font-bold text-ceda-ink">
                    Award recognition
                  </h3>
                </div>
                <ul className="mt-4 space-y-3">
                  {tracked.awards.map((award) => (
                    <li key={award.id} className="rounded-xl bg-white/80 p-4">
                      <p className="font-bold text-ceda-burgundy">
                        {award.title}
                        {award.tier ? ` · ${award.tier}` : ""}
                      </p>
                      {award.description && (
                        <p className="mt-1 text-sm leading-6 text-ceda-body">
                          {award.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-ceda-muted">
                        Awarded{" "}
                        {award.awardedAt.toLocaleDateString("en-BW", {
                          dateStyle: "long",
                          timeZone: "Africa/Gaborone",
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Two-column lower details: Timeline + Free Alert Subscription */}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              {/* Chronological timeline */}
              <section
                aria-labelledby="tracked-timeline-heading"
                className="rounded-2xl border border-ceda-line bg-white p-6 shadow-sm sm:p-7">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    id="tracked-timeline-heading"
                    className="text-lg font-bold text-ceda-ink">
                    Stage history
                  </h3>
                  <span className="text-xs text-ceda-muted">
                    {tracked.history.length}{" "}
                    {tracked.history.length === 1 ? "event" : "events"}
                  </span>
                </div>

                {tracked.history.length > 0 ? (
                  <ol className="mt-5 space-y-4">
                    {tracked.history.map((item, index) => (
                      <li key={item.id} className="flex gap-3.5">
                        <span
                          aria-hidden="true"
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ceda-cream-mid text-xs font-bold text-ceda-burgundy">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold capitalize text-ceda-ink">
                            {item.stageName ?? item.status.replaceAll("_", " ")}
                          </p>
                          <p className="mt-0.5 text-xs capitalize text-ceda-muted">
                            {item.status.replaceAll("_", " ")} ·{" "}
                            {item.createdAt.toLocaleString("en-BW", {
                              dateStyle: "medium",
                              timeStyle: "short",
                              timeZone: "Africa/Gaborone",
                            })}{" "}
                            CAT
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-4 flex items-center gap-2 rounded-xl bg-surface-muted p-4 text-sm text-ceda-muted">
                    <Clock3 aria-hidden="true" className="h-4 w-4 shrink-0" />
                    No stage transitions have been logged yet.
                  </p>
                )}

                <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-ceda-line pt-5 text-xs">
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-ceda-muted">
                      Submitted
                    </dt>
                    <dd className="mt-1 font-medium text-ceda-ink">
                      {tracked.submittedAt
                        ? tracked.submittedAt.toLocaleDateString("en-BW", {
                            dateStyle: "medium",
                            timeZone: "Africa/Gaborone",
                          })
                        : "Not yet submitted"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-ceda-muted">
                      Last updated
                    </dt>
                    <dd className="mt-1 font-medium text-ceda-ink">
                      {tracked.updatedAt.toLocaleDateString("en-BW", {
                        dateStyle: "medium",
                        timeZone: "Africa/Gaborone",
                      })}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Free Status Alerts panel */}
              <section
                aria-labelledby="tracked-alerts-heading"
                className="flex flex-col justify-between rounded-2xl border border-ceda-line bg-white p-6 shadow-sm sm:p-7">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ceda-cream-mid text-ceda-burgundy">
                      <Bell aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <h3
                      id="tracked-alerts-heading"
                      className="text-lg font-bold text-ceda-ink">
                      Free status alerts
                    </h3>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-ceda-body">
                    {tracked.status === "draft" || tracked.status === "withdrawn"
                      ? "Status alerts become active automatically once this submission is submitted into the review pipeline."
                      : tracked.isFollowing
                        ? "You are subscribed to lifecycle alerts for this submission."
                        : "Subscribe to receive free alerts whenever this submission moves to a new stage or receives a decision."}
                  </p>

                  {tracked.status !== "draft" &&
                    tracked.status !== "withdrawn" && (
                      <form action={toggleTrackedIdeaAlert} className="mt-4">
                        <input type="hidden" name="ideaId" value={tracked.id} />
                        <input
                          type="hidden"
                          name="referenceNo"
                          value={tracked.referenceNo}
                        />
                        <input
                          type="hidden"
                          name="follow"
                          value={tracked.isFollowing ? "false" : "true"}
                        />
                        <button
                          type="submit"
                          className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange ${
                            tracked.isFollowing
                              ? "border border-ceda-burgundy bg-white text-ceda-burgundy hover:bg-ceda-cream"
                              : "bg-ceda-burgundy text-white hover:bg-ceda-burgundy-dark"
                          }`}>
                          {tracked.isFollowing ? (
                            <>
                              <BellOff aria-hidden="true" className="h-4 w-4" />
                              Pause alerts for this idea
                            </>
                          ) : (
                            <>
                              <Bell aria-hidden="true" className="h-4 w-4" />
                              Subscribe to free alerts
                            </>
                          )}
                        </button>
                      </form>
                    )}

                  <div className="mt-5 rounded-xl border border-ceda-line bg-[#FFFDFC] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-ceda-muted">
                      Your alert channels
                    </p>
                    <ul className="mt-2.5 space-y-2 text-xs text-ceda-body">
                      <li className="flex items-center justify-between gap-2">
                        <span>In-portal notifications</span>
                        <span
                          className={`font-semibold ${channels.inApp ? "text-(--status-success-ink)" : "text-ceda-muted"}`}>
                          {channels.inApp ? "Enabled" : "Paused"}
                        </span>
                      </li>
                      <li className="flex items-center justify-between gap-2">
                        <span>Email alerts</span>
                        <span
                          className={`font-semibold ${channels.email ? "text-(--status-success-ink)" : "text-ceda-muted"}`}>
                          {channels.email ? "Enabled" : "Paused"}
                        </span>
                      </li>
                      <li className="flex items-center justify-between gap-2">
                        <span>SMS alerts</span>
                        <span className="font-semibold text-ceda-muted">
                          {channels.sms ? "Saved (gateway pending)" : "Off"}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-5 border-t border-ceda-line pt-4">
                  <Link
                    href="/account/settings"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-ceda-burgundy hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                    <Settings aria-hidden="true" className="h-3.5 w-3.5" />
                    Manage notification preferences
                  </Link>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ceda-muted">
                    <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-ceda-burgundy" />
                    Evaluation scores and internal notes remain restricted.
                  </p>
                </div>
              </section>
            </div>
          </section>
        )}

        {/* Quick-select list of the signed-in user's own submissions */}
        <section
          aria-labelledby="your-submissions-heading"
          className="mt-8 rounded-2xl border border-ceda-line bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2
                id="your-submissions-heading"
                className="text-lg font-bold text-ceda-ink">
                Your submissions
              </h2>
              <p className="mt-1 text-xs text-ceda-muted">
                Select any of your submissions to open its live pipeline view
                instantly.
              </p>
            </div>
            <Link
              href="/submit"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-ceda-line bg-white px-4 text-xs font-bold text-ceda-burgundy transition hover:bg-ceda-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
              New submission
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>

          {userSubmissions.length > 0 ? (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {userSubmissions.map((item) => {
                const isSelected = item.referenceNo === normalizedRef;
                return (
                  <li key={item.id}>
                    <Link
                      href={`/track?ref=${encodeURIComponent(item.referenceNo)}`}
                      aria-current={isSelected ? "page" : undefined}
                      className={`block rounded-xl border p-4 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange ${
                        isSelected
                          ? "border-ceda-burgundy bg-ceda-cream ring-1 ring-ceda-burgundy/20"
                          : "border-ceda-line bg-[#FFFDFC] hover:border-ceda-burgundy/40 hover:bg-ceda-cream/50"
                      }`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-ceda-burgundy">
                          {item.referenceNo}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="mt-2 truncate text-sm font-bold text-ceda-ink">
                        {item.title || "Untitled submission"}
                      </p>
                      <p className="mt-1 truncate text-xs text-ceda-muted">
                        {item.stageName ?? item.callTitle}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-5 rounded-xl bg-surface-muted p-6 text-center">
              <p className="text-sm font-semibold text-ceda-ink">
                No submissions under your account yet
              </p>
              <p className="mt-1 text-xs text-ceda-muted">
                Once you submit an idea, its reference number will appear here
                for one-click tracking.
              </p>
              <Link
                href="/submit"
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-ceda-burgundy px-5 text-xs font-bold text-white transition hover:bg-ceda-burgundy-dark">
                Start an application
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
