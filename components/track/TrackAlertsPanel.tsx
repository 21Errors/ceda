import Link from "next/link";
import { Bell, BellOff, Settings, ShieldCheck } from "lucide-react";
import { toggleTrackedIdeaAlert } from "@/app/(submissions)/track/actions";
import type { TrackedSubmission, UserAlertChannelSummary } from "./types";

export function TrackAlertsPanel({
  tracked,
  channels,
}: {
  tracked: TrackedSubmission;
  channels: UserAlertChannelSummary;
}) {
  return (
    <section
      aria-labelledby="tracked-alerts-heading"
      className="flex flex-col justify-between rounded-2xl border border-ceda-line bg-white p-6 shadow-sm sm:p-7"
    >
      <div>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ceda-cream-mid text-ceda-burgundy">
            <Bell aria-hidden="true" className="h-4 w-4" />
          </span>
          <h3 id="tracked-alerts-heading" className="text-lg font-bold text-ceda-ink">
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

        {tracked.status !== "draft" && tracked.status !== "withdrawn" && (
          <form action={toggleTrackedIdeaAlert} className="mt-4">
            <input type="hidden" name="ideaId" value={tracked.id} />
            <input type="hidden" name="referenceNo" value={tracked.referenceNo} />
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
              }`}
            >
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
                className={`font-semibold ${channels.inApp ? "text-(--status-success-ink)" : "text-ceda-muted"}`}
              >
                {channels.inApp ? "Enabled" : "Paused"}
              </span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span>Email alerts</span>
              <span
                className={`font-semibold ${channels.email ? "text-(--status-success-ink)" : "text-ceda-muted"}`}
              >
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ceda-burgundy hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
        >
          <Settings aria-hidden="true" className="h-3.5 w-3.5" />
          Manage notification preferences
        </Link>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ceda-muted">
          <ShieldCheck
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 text-ceda-burgundy"
          />
          Evaluation scores and internal notes remain restricted.
        </p>
      </div>
    </section>
  );
}
