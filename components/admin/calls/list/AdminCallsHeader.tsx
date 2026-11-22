export function AdminCallsHeader({ totalCount }: { totalCount: number }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-ceda-burgundy">
          Calls &amp; reviews
        </p>
        <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ceda-ink sm:text-3xl">
          Innovation calls
        </h1>
        <p className="mt-1 text-sm leading-6 text-ceda-muted">
          View all {totalCount} innovation {totalCount === 1 ? "call" : "calls"}
          , check schedules, and open any call to update its questions, stages,
          or scoring rules.
        </p>
      </div>
    </header>
  );
}
