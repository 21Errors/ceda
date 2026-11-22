import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { OpenNotificationsButton } from "@/components/notifications/OpenNotificationsButton";
import { TrackedSubmissionDetails } from "@/components/track/TrackedSubmissionDetails";
import { TrackLookupCard } from "@/components/track/TrackLookupCard";
import { TrackSignInGate } from "@/components/track/TrackSignInGate";
import { UserSubmissionsGrid } from "@/components/track/UserSubmissionsGrid";
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
    return <TrackSignInGate normalizedRef={normalizedRef} />;
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
      className="flex-1 bg-[#F7F8F9] px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
    >
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
              Enter your CEDA reference number to inspect live pipeline progress,
              stage history, and free status alert subscriptions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isCommitteeMember && (
              <Link
                href="/committee"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ceda-line bg-white px-4 text-xs font-semibold text-ceda-burgundy transition hover:bg-ceda-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
              >
                Committee monitor
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            )}
            <OpenNotificationsButton label="Notification inbox" />
          </div>
        </header>

        <TrackLookupCard
          normalizedRef={normalizedRef}
          hasValidFormat={hasValidFormat}
          hasMatch={Boolean(tracked)}
        />

        {alertNotice === "followed" && (
          <p
            role="status"
            className="mt-5 flex items-center gap-2 rounded-xl border border-[#16803C]/25 bg-(--status-success-bg) px-4 py-3 text-sm font-medium text-(--status-success-ink)"
          >
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
            Free status alerts enabled for this submission. You will be notified
            whenever its workflow stage or status changes.
          </p>
        )}
        {alertNotice === "unfollowed" && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-ceda-line bg-white px-4 py-3 text-sm text-ceda-body"
          >
            Status alerts paused for this submission. You can re-enable alerts at
            any time.
          </p>
        )}
        {errorNotice && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-[#B42318]/25 bg-(--status-danger-bg) px-4 py-3 text-sm text-(--status-danger-ink)"
          >
            Unable to update alert subscription for that submission. Refresh and
            try again.
          </p>
        )}

        {tracked && pipelineState && nextStep && (
          <TrackedSubmissionDetails
            tracked={tracked}
            pipelineState={pipelineState}
            nextStep={nextStep}
            channels={channels}
          />
        )}

        <UserSubmissionsGrid
          submissions={userSubmissions}
          normalizedRef={normalizedRef}
        />
      </div>
    </main>
  );
}
