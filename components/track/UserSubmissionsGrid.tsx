import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import type { TrackableUserSubmission } from "./types";

export function UserSubmissionsGrid({
  submissions,
  normalizedRef,
}: {
  submissions: TrackableUserSubmission[];
  normalizedRef: string;
}) {
  return (
    <section
      aria-labelledby="your-submissions-heading"
      className="mt-8 rounded-2xl border border-ceda-line bg-white p-6 shadow-sm sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="your-submissions-heading" className="text-lg font-bold text-ceda-ink">
            Your submissions
          </h2>
          <p className="mt-1 text-xs text-ceda-muted">
            Select any of your submissions to open its live pipeline view instantly.
          </p>
        </div>
        <Link
          href="/submit"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-ceda-line bg-white px-4 text-xs font-bold text-ceda-burgundy transition hover:bg-ceda-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
        >
          New submission
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>

      {submissions.length > 0 ? (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {submissions.map((item) => {
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
                  }`}
                >
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
            Once you submit an idea, its reference number will appear here for
            one-click tracking.
          </p>
          <Link
            href="/submit"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-ceda-burgundy px-5 text-xs font-bold text-white transition hover:bg-ceda-burgundy-dark"
          >
            Start an application
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
}
