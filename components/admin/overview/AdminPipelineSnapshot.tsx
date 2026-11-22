import Link from "next/link";
import { ChevronRight, GitPullRequestArrow } from "lucide-react";
import type { AdminPipelineBreakdown } from "@/lib/server/admin-overview";

export function AdminPipelineSnapshot({
  breakdown,
  totalSubmissions,
}: {
  breakdown: AdminPipelineBreakdown;
  totalSubmissions: number;
}) {
  const stages = [
    { label: "Drafts", value: breakdown.drafts, tone: "text-ceda-muted" },
    { label: "Submitted", value: breakdown.submitted, tone: "text-[#C56500]" },
    { label: "In review", value: breakdown.inReview, tone: "text-[#315EDB]" },
    { label: "Revisions", value: breakdown.changesRequested, tone: "text-[#7C3D00]" },
    { label: "Approved", value: breakdown.approved, tone: "text-[#14532D]" },
    { label: "Awarded", value: breakdown.awarded, tone: "text-ceda-burgundy" },
  ];

  return (
    <section
      aria-labelledby="pipeline-snapshot-heading"
      className="overflow-hidden rounded-card border border-ceda-line bg-white shadow-xs"
    >
      <div className="flex items-center justify-between gap-ds-3 border-b border-ceda-line px-card py-ds-4">
        <div className="flex items-center gap-ds-2">
          <GitPullRequestArrow aria-hidden="true" className="h-4 w-4 text-ceda-burgundy" />
          <h2 id="pipeline-snapshot-heading" className="text-base font-bold text-ceda-ink">
            Submission pipeline
          </h2>
        </div>
        <Link
          href="/admin/reviews"
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-ceda-burgundy hover:underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
        >
          <span>Open queue</span>
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="p-card">
        <dl className="grid grid-cols-3 gap-ds-3">
          {stages.map((stage) => (
            <div
              key={stage.label}
              className="rounded-xl border border-ceda-line/70 bg-ceda-cream/40 px-3 py-2.5"
            >
              <dt className="text-xs text-ceda-muted">{stage.label}</dt>
              <dd className={`mt-1 text-xl font-extrabold tabular-nums ${stage.tone}`}>
                {stage.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-ds-3 text-xs text-ceda-muted">
          {totalSubmissions}{" "}
          {totalSubmissions === 1 ? "submission" : "submissions"} tracked across all stages.
        </p>
      </div>
    </section>
  );
}
