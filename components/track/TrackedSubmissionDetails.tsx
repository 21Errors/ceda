import Link from "next/link";
import { ArrowRight, Clock3, Trophy } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { PipelineStepper } from "@/components/ui/PipelineStepper";
import type { mapIdeaToPipelineStage } from "@/lib/track-pipeline";
import { TrackAlertsPanel } from "./TrackAlertsPanel";
import type { TrackedSubmission, UserAlertChannelSummary } from "./types";

type PipelineState = ReturnType<typeof mapIdeaToPipelineStage>;

export function TrackedSubmissionDetails({
  tracked,
  pipelineState,
  nextStep,
  channels,
}: {
  tracked: TrackedSubmission;
  pipelineState: PipelineState;
  nextStep: string;
  channels: UserAlertChannelSummary;
}) {
  return (
    <section aria-labelledby="tracked-title" className="mt-7 space-y-6">
      {/* Hero status summary */}
      <div className="overflow-hidden rounded-2xl border border-ceda-line bg-white shadow-sm">
        <div className="bg-ceda-burgundy-dark px-6 py-6 text-white sm:px-8 sm:py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-ceda-peach">
                {tracked.referenceNo}
              </p>
              <h2 id="tracked-title" className="mt-2 text-2xl font-bold sm:text-3xl">
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
            <StatusBadge status={tracked.status} className="bg-white/95 shadow-xs" />
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-ceda-muted">
              Lifecycle pipeline
            </h3>
            <span className="text-xs font-semibold text-ceda-burgundy">
              Current stage: {tracked.stageName ?? tracked.status.replaceAll("_", " ")}
            </span>
          </div>

          <div className="mt-4">
            <PipelineStepper
              currentStage={pipelineState.currentStage}
              changesRequested={pipelineState.changesRequested}
            />
          </div>

          <div
            className={`mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 sm:p-5 ${
              tracked.status === "changes_requested"
                ? "border-(--status-warning-border)/40 bg-(--status-warning-bg)"
                : tracked.status === "rejected"
                  ? "border-[#B42318]/25 bg-(--status-danger-bg)"
                  : "border-ceda-line bg-ceda-cream"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-ceda-burgundy">
                What happens next
              </p>
              <p className="mt-1 text-sm leading-6 text-ceda-ink">{nextStep}</p>
            </div>

            {tracked.isOwner && (
              <Link
                href={
                  tracked.status === "draft"
                    ? `/submit?draft=${tracked.id}`
                    : `/dashboard/submissions/${tracked.id}`
                }
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-ceda-burgundy px-5 text-xs font-bold text-white transition hover:bg-ceda-burgundy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange sm:text-sm"
              >
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

      {/* Award recognition callout */}
      {tracked.awards.length > 0 && (
        <section
          aria-labelledby="tracked-awards-heading"
          className="rounded-2xl border border-[#E8B36D] bg-[#FFF9F0] p-6 shadow-sm sm:p-7"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ceda-burgundy text-white">
              <Trophy aria-hidden="true" className="h-5 w-5" />
            </span>
            <h3 id="tracked-awards-heading" className="text-lg font-bold text-ceda-ink">
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
                  <p className="mt-1 text-sm leading-6 text-ceda-body">{award.description}</p>
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

      {/* Timeline + Free Alert Subscription */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section
          aria-labelledby="tracked-timeline-heading"
          className="rounded-2xl border border-ceda-line bg-white p-6 shadow-sm sm:p-7"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 id="tracked-timeline-heading" className="text-lg font-bold text-ceda-ink">
              Stage history
            </h3>
            <span className="text-xs text-ceda-muted">
              {tracked.history.length} {tracked.history.length === 1 ? "event" : "events"}
            </span>
          </div>

          {tracked.history.length > 0 ? (
            <ol className="mt-5 space-y-4">
              {tracked.history.map((item, index) => (
                <li key={item.id} className="flex gap-3.5">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ceda-cream-mid text-xs font-bold text-ceda-burgundy"
                  >
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

        <TrackAlertsPanel tracked={tracked} channels={channels} />
      </div>
    </section>
  );
}
