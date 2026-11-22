import type { AdminCallListItem } from "@/lib/server/admin-calls";

export function AdminCallsSummaryBar({
  calls,
}: {
  calls: readonly AdminCallListItem[];
}) {
  const openCount = calls.filter((call) => call.status === "open").length;
  const draftCount = calls.filter((call) => call.status === "draft").length;
  const closedOrArchivedCount = calls.filter(
    (call) => call.status === "closed" || call.status === "archived",
  ).length;
  const totalSubmissions = calls.reduce(
    (sum, call) => sum + call.submissionsTotal,
    0,
  );

  const stats = [
    { label: "Total calls", value: calls.length },
    { label: "Open now", value: openCount },
    { label: "Drafts", value: draftCount },
    { label: "Closed & archived", value: closedOrArchivedCount },
    { label: "Total applications", value: totalSubmissions },
  ];

  return (
    <section
      aria-label="Innovation call totals"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-ceda-line bg-white px-4 py-3.5 shadow-xs"
        >
          <p className="text-xs font-medium text-ceda-muted">{stat.label}</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-ceda-ink">
            {stat.value}
          </p>
        </div>
      ))}
    </section>
  );
}
