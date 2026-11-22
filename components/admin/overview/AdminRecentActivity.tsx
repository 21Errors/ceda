import Link from "next/link";
import { ChevronRight, ScrollText } from "lucide-react";
import type { AdminAuditItem } from "@/lib/server/admin-overview";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-BW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Gaborone",
});

const FRIENDLY_ACTIONS: Record<string, string> = {
  "auth.session.created": "Signed in",
  "account.registered": "Account registered",
  "idea.submitted": "Idea submitted",
  "evaluation.scored": "Evaluation scored",
  "role.assigned": "Role assigned",
};

function formatAuditAction(action: string): string {
  const mapped = FRIENDLY_ACTIONS[action];
  if (mapped) return mapped;
  const cleaned = action.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Recorded event";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function AdminRecentActivity({ entries }: { entries: AdminAuditItem[] }) {
  return (
    <section
      aria-labelledby="activity-heading"
      className="overflow-hidden rounded-card border border-ceda-line bg-white shadow-xs"
    >
      <div className="flex items-center justify-between gap-ds-3 border-b border-ceda-line px-card py-ds-4">
        <div className="flex items-center gap-ds-2">
          <ScrollText aria-hidden="true" className="h-4 w-4 text-ceda-burgundy" />
          <h2 id="activity-heading" className="text-base font-bold text-ceda-ink">
            Recent activity
          </h2>
        </div>
        <Link
          href="/admin/audit"
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-ceda-burgundy hover:underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
        >
          <span>Full audit trail</span>
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>

      {entries.length > 0 ? (
        <ol className="divide-y divide-ceda-line/70">
          {entries.map((entry) => (
            <li key={entry.id} className="px-card py-3">
              <div className="flex items-baseline justify-between gap-ds-3">
                <p className="min-w-0 truncate text-sm font-semibold text-ceda-ink">
                  {formatAuditAction(entry.action)}
                </p>
                <time
                  dateTime={entry.createdAt.toISOString()}
                  className="shrink-0 text-[11px] tabular-nums text-ceda-muted"
                >
                  {DATE_TIME_FORMATTER.format(entry.createdAt)}
                </time>
              </div>
              <p className="mt-0.5 truncate text-xs text-ceda-muted">
                {entry.actorName ?? "System"} on {entry.entityType.replaceAll("_", " ")}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-card py-ds-6 text-sm text-ceda-muted">
          Recorded governance, role, and workflow events will appear here.
        </p>
      )}
    </section>
  );
}
