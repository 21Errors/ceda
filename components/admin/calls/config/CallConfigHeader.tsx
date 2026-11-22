import type { CallConfigSummary, CallStatusValue } from "./types";

const STATUS_LABEL_MAP: Record<CallStatusValue, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  archived: "Archived",
};

export function CallConfigHeader({
  call,
  activeFieldsCount,
  stagesCount,
  activeCriteriaCount,
}: {
  call: CallConfigSummary;
  activeFieldsCount: number;
  stagesCount: number;
  activeCriteriaCount: number;
}) {
  const statusLabel = STATUS_LABEL_MAP[call.status] ?? "Draft";

  return (
    <header className="flex flex-col gap-5 rounded-2xl bg-[#5C150D] p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F4B58A]">
            Call configuration
          </p>
          <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white">
            {statusLabel}
          </span>
        </div>
        <h1 id="call-title" className="mt-2 text-2xl font-bold sm:text-3xl">
          {call.title}
        </h1>
        <p className="mt-1.5 text-sm text-white/75">
          Set up the application questions, review stages, scoring rules, and
          status step by step.
        </p>
      </div>

      <dl className="flex shrink-0 flex-wrap gap-3 text-xs">
        <div className="rounded-xl border border-white/15 bg-white/10 px-3.5 py-2">
          <dt className="text-white/70">Active fields</dt>
          <dd className="mt-0.5 text-base font-bold tabular-nums text-white">
            {activeFieldsCount}
          </dd>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/10 px-3.5 py-2">
          <dt className="text-white/70">Review stages</dt>
          <dd className="mt-0.5 text-base font-bold tabular-nums text-white">
            {stagesCount}
          </dd>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/10 px-3.5 py-2">
          <dt className="text-white/70">Scoring rules</dt>
          <dd className="mt-0.5 text-base font-bold tabular-nums text-white">
            {activeCriteriaCount}
          </dd>
        </div>
      </dl>
    </header>
  );
}
