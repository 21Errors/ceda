import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  AdminCallListItem,
  AdminCallStatus,
} from "@/lib/server/admin-calls";

const STATUS_META: Record<
  AdminCallStatus,
  { label: string; pillClass: string; dotClass: string }
> = {
  open: {
    label: "Open",
    pillClass: "border-emerald-200 bg-emerald-50 text-emerald-900",
    dotClass: "bg-emerald-600",
  },
  draft: {
    label: "Draft",
    pillClass: "border-neutral-200 bg-neutral-100 text-neutral-800",
    dotClass: "bg-neutral-500",
  },
  closed: {
    label: "Closed",
    pillClass: "border-red-200 bg-red-50 text-red-900",
    dotClass: "bg-red-600",
  },
  archived: {
    label: "Archived",
    pillClass: "border-slate-200 bg-slate-100 text-slate-700",
    dotClass: "bg-slate-400",
  },
};

export function AdminCallListCard({ call }: { call: AdminCallListItem }) {
  const status = STATUS_META[call.status];

  return (
    <article
      className={cn(
        "rounded-2xl border border-ceda-line bg-white p-5 shadow-xs transition hover:border-ceda-burgundy/35 sm:p-6",
        call.status === "open" && "border-s-[3px] border-s-ceda-burgundy",
      )}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                status.pillClass,
              )}
            >
              <span
                aria-hidden="true"
                className={cn("h-2 w-2 rounded-full", status.dotClass)}
              />
              {status.label}
            </span>

            <span className="inline-flex items-center gap-1.5 text-xs text-ceda-muted">
              <Calendar aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span>
                Opens <strong className="font-semibold text-ceda-ink">{call.opensAtLabel}</strong>
                {" · "}
                Closes <strong className="font-semibold text-ceda-ink">{call.closesAtLabel}</strong>
              </span>
            </span>

            {call.deadlineHint ? (
              <span className="rounded-full bg-ceda-cream-mid px-2.5 py-0.5 text-xs font-semibold text-ceda-burgundy">
                {call.deadlineHint}
              </span>
            ) : null}
          </div>

          <h2 className="mt-3 text-lg font-bold leading-snug text-ceda-ink">
            <Link
              href={`/admin/calls/${call.id}`}
              className="transition-colors hover:text-ceda-burgundy focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
            >
              {call.title}
            </Link>
          </h2>

          {call.description ? (
            <p className="mt-1 line-clamp-2 max-w-3xl text-sm leading-6 text-ceda-muted">
              {call.description}
            </p>
          ) : null}

          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-ceda-line/70 pt-3.5 text-xs">
            <div className="flex items-baseline gap-1.5">
              <dt className="text-ceda-muted">Applications</dt>
              <dd className="font-bold tabular-nums text-ceda-ink">
                {call.submissionsTotal}
                {call.submissionsInPipeline > 0 ? (
                  <span className="ms-1 font-normal text-ceda-muted">
                    ({call.submissionsInPipeline} in review)
                  </span>
                ) : null}
              </dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className="text-ceda-muted">Form fields</dt>
              <dd className="font-bold tabular-nums text-ceda-ink">
                {call.fieldCount}
              </dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className="text-ceda-muted">Review stages</dt>
              <dd className="font-bold tabular-nums text-ceda-ink">
                {call.stageCount}
              </dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className="text-ceda-muted">Scoring rules</dt>
              <dd className="font-bold tabular-nums text-ceda-ink">
                {call.criteriaCount}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:flex-col lg:items-end">
          <Link
            href={`/admin/calls/${call.id}`}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-ceda-burgundy/30 bg-white px-4 text-sm font-semibold text-ceda-burgundy transition hover:border-ceda-burgundy hover:bg-ceda-burgundy hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
          >
            <span>Configure call</span>
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Link>

          <div className="flex flex-wrap items-center gap-3 px-1 text-xs font-semibold text-ceda-muted">
            <Link
              href={`/admin/calls/${call.id}?step=fields`}
              className="hover:text-ceda-burgundy hover:underline underline-offset-4"
            >
              Fields
            </Link>
            <Link
              href={`/admin/calls/${call.id}?step=stages`}
              className="hover:text-ceda-burgundy hover:underline underline-offset-4"
            >
              Stages
            </Link>
            <Link
              href={`/admin/calls/${call.id}?step=criteria`}
              className="hover:text-ceda-burgundy hover:underline underline-offset-4"
            >
              Scoring
            </Link>
            {call.submissionsInPipeline > 0 ? (
              <Link
                href="/admin/reviews"
                className="text-ceda-burgundy hover:underline underline-offset-4"
              >
                Review queue
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
