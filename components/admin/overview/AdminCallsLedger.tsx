import Link from "next/link";
import {
  Archive,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileEdit,
  FolderPlus,
  Lock,
  Plus,
} from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import type { AdminCallSummary, CallStatus } from "@/lib/server/admin-overview";

const CALL_STATUS_META: Record<
  CallStatus,
  { label: string; tone: BadgeTone; Icon: typeof CheckCircle2 }
> = {
  open: { label: "Open", tone: "success", Icon: CheckCircle2 },
  draft: { label: "Draft", tone: "warning", Icon: FileEdit },
  closed: { label: "Closed", tone: "neutral", Icon: Lock },
  archived: { label: "Archived", tone: "neutral", Icon: Archive },
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-BW", {
  dateStyle: "medium",
  timeZone: "Africa/Gaborone",
});

export function AdminCallsLedger({
  calls,
  openCallsCount,
}: {
  calls: AdminCallSummary[];
  openCallsCount: number;
}) {
  return (
    <section
      aria-labelledby="calls-heading"
      className="overflow-hidden rounded-card border border-ceda-line bg-white shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-ds-3 border-b border-ceda-line px-card py-ds-5">
        <div className="min-w-0">
          <h2 id="calls-heading" className="text-lg font-bold tracking-tight text-ceda-ink">
            Innovation calls
          </h2>
          <p className="mt-0.5 text-sm text-ceda-muted">
            Manage application windows, submission forms, workflow stages, and scoring rubrics.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-ds-2">
          {openCallsCount > 0 ? (
            <Badge tone="success" dot size="sm">
              {openCallsCount} active
            </Badge>
          ) : null}
          <Badge tone="neutral" size="sm">
            {calls.length} total
          </Badge>
          <Link
            href="/admin/calls"
            className="ms-1 inline-flex items-center gap-0.5 text-xs font-semibold text-ceda-burgundy hover:underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
          >
            <span>View all</span>
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {calls.length > 0 ? (
        <ul className="divide-y divide-ceda-line">
          {calls.map((call) => {
            const meta = CALL_STATUS_META[call.status];
            const StatusIcon = meta.Icon;

            return (
              <li
                key={call.id}
                className={`@container transition-colors hover:bg-[#FFFCFA] ${
                  call.status === "open"
                    ? "border-s-[3px] border-s-ceda-burgundy"
                    : "border-s-[3px] border-s-transparent"
                }`}
              >
                <div className="grid grid-cols-1 items-start gap-ds-4 p-card @[540px]:grid-cols-[minmax(0,1fr)_auto] @[540px]:gap-ds-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-ds-2">
                      <Badge
                        tone={meta.tone}
                        size="sm"
                        icon={<StatusIcon className="h-3.5 w-3.5" />}
                      >
                        {meta.label}
                      </Badge>

                      {call.closesAt ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ceda-muted">
                          <Calendar aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            Closes{" "}
                            <time dateTime={call.closesAt.toISOString()}>
                              {DATE_FORMATTER.format(call.closesAt)}
                            </time>
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-ceda-muted">No closing date set</span>
                      )}

                      {call.deadlineHint ? (
                        <Badge tone="warning" size="sm">
                          {call.deadlineHint}
                        </Badge>
                      ) : null}
                    </div>

                    <h3 className="mt-ds-3 text-base font-bold leading-snug text-ceda-ink sm:text-lg">
                      <Link
                        href={`/admin/calls/${call.id}`}
                        className="transition-colors hover:text-ceda-burgundy focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                      >
                        {call.title}
                      </Link>
                    </h3>

                    {call.description ? (
                      <p className="mt-1 line-clamp-2 max-w-2xl text-sm leading-6 text-ceda-muted">
                        {call.description}
                      </p>
                    ) : null}

                    <dl className="mt-ds-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-ceda-line/70 pt-ds-3 text-xs">
                      <div className="flex items-baseline gap-1.5">
                        <dt className="text-ceda-muted">Submissions</dt>
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
                        <dt className="text-ceda-muted">Workflow stages</dt>
                        <dd className="font-bold tabular-nums text-ceda-ink">{call.stageCount}</dd>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <dt className="text-ceda-muted">Form fields</dt>
                        <dd className="font-bold tabular-nums text-ceda-ink">{call.fieldCount}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-ds-2 @[540px]:flex-col @[540px]:items-end">
                    <Link
                      href={`/admin/calls/${call.id}`}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-ceda-burgundy/30 bg-white px-4 text-sm font-semibold text-ceda-burgundy transition-[background-color,border-color,color] duration-150 hover:border-ceda-burgundy hover:bg-ceda-burgundy hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                    >
                      <span>Configure call</span>
                      <ChevronRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                    {call.submissionsInPipeline > 0 ? (
                      <Link
                        href="/admin/reviews"
                        className="inline-flex min-h-8 items-center gap-1 px-2 text-xs font-semibold text-ceda-muted transition-colors hover:text-ceda-burgundy focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                      >
                        <span>Inspect queue</span>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center px-card py-ds-12 text-center">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ceda-cream-mid text-ceda-burgundy"
          >
            <FolderPlus className="h-6 w-6" />
          </span>
          <h3 className="mt-ds-4 text-base font-bold text-ceda-ink">
            No innovation calls configured yet
          </h3>
          <p className="mt-1.5 max-w-md text-sm leading-6 text-ceda-muted">
            Create your first innovation call to define an application window, custom submission form fields, and evaluation stages.
          </p>
          <div className="mt-ds-5">
            <ButtonLink
              href="/admin/calls/new"
              variant="primary"
              size="md"
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create your first call
            </ButtonLink>
          </div>
        </div>
      )}
    </section>
  );
}
