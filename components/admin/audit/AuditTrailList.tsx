import { formatAuditAction, formatPortalDateTime } from "@/lib/format";
import type { AuditEntryRecord } from "@/lib/server/admin-governance";

export function AuditTrailList({
  entries,
}: {
  entries: readonly AuditEntryRecord[];
}) {
  if (!entries.length) {
    return (
      <p className="mt-7 rounded-xl bg-[#FFF9F4] p-5 text-sm text-ceda-muted">
        No audit events have been recorded yet.
      </p>
    );
  }

  return (
    <ol className="mt-7 divide-y divide-ceda-line rounded-2xl border border-ceda-line bg-white">
      {entries.map((entry) => (
        <li key={entry.id} className="p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold text-ceda-ink">
                {formatAuditAction(entry.action)}
              </p>
              <p className="mt-1 text-xs text-ceda-muted">
                {entry.actorName ?? "System or deleted account"}
                {entry.actorEmail ? ` (${entry.actorEmail})` : ""} ·{" "}
                {entry.entityType}
                {entry.entityId ? ` · ${entry.entityId}` : ""}
              </p>
            </div>
            <time
              className="shrink-0 text-xs text-ceda-muted"
              dateTime={entry.createdAt.toISOString()}
            >
              {formatPortalDateTime(entry.createdAt)}
            </time>
          </div>
          {entry.metadata || entry.ipAddress ? (
            <details className="mt-3">
              <summary className="w-fit cursor-pointer text-xs font-semibold text-ceda-burgundy">
                View event details
              </summary>
              <dl className="mt-2 grid gap-2 rounded-lg bg-[#FFF9F4] p-3 text-xs sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-ceda-ink">Metadata</dt>
                  <dd className="mt-1 break-all text-ceda-body">
                    {entry.metadata ? JSON.stringify(entry.metadata) : "None"}
                  </dd>
                </div>
                {entry.ipAddress ? (
                  <div>
                    <dt className="font-semibold text-ceda-ink">IP address</dt>
                    <dd className="mt-1 text-ceda-body">{entry.ipAddress}</dd>
                  </div>
                ) : null}
              </dl>
            </details>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
