import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Suspense } from "react";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { db } from "@/db";
import { auditLogs, user } from "@/db/schema";
import { requireRole } from "@/lib/authorization";

export default function AuditPage() {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="list" />}>
      <AuditContent />
    </Suspense>
  );
}

async function AuditContent() {
  await requireRole("admin", "/admin/audit");
  const entries = await db
    .select({
      id: auditLogs.id,
      actorName: user.name,
      actorEmail: user.email,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(user, eq(auditLogs.actorId, user.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);

  return (
    <main
      id="main-content"
      className="flex-1 bg-white px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-275">
        <Link
          href="/admin"
          className="text-sm font-semibold text-ceda-burgundy underline underline-offset-4">
          ← Back to administration
        </Link>
        <header className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
            Governance
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ceda-ink">Audit trail</h1>
          <p className="mt-2 text-sm leading-6 text-ceda-muted">
            Recent recorded account, workflow and support actions. Showing the
            latest 200 entries.
          </p>
        </header>
        {entries.length ? (
          <ol className="mt-7 divide-y divide-ceda-line rounded-2xl border border-ceda-line">
            {entries.map((entry) => (
              <li key={entry.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-ceda-ink">
                      {entry.action.replaceAll(".", " · ")}
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
                    dateTime={entry.createdAt.toISOString()}>
                    {entry.createdAt.toLocaleString("en-BW", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Africa/Gaborone",
                    })}
                  </time>
                </div>
                {(entry.metadata || entry.ipAddress) && (
                  <details className="mt-3">
                    <summary className="w-fit cursor-pointer text-xs font-semibold text-ceda-burgundy">
                      View event details
                    </summary>
                    <dl className="mt-2 grid gap-2 rounded-lg bg-[#FFF9F4] p-3 text-xs sm:grid-cols-2">
                      <div>
                        <dt className="font-semibold text-ceda-ink">
                          Metadata
                        </dt>
                        <dd className="mt-1 break-all text-ceda-body">
                          {entry.metadata
                            ? JSON.stringify(entry.metadata)
                            : "None"}
                        </dd>
                      </div>
                      {entry.ipAddress && (
                        <div>
                          <dt className="font-semibold text-ceda-ink">
                            IP address
                          </dt>
                          <dd className="mt-1 text-ceda-body">
                            {entry.ipAddress}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </details>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-7 rounded-xl bg-[#FFF9F4] p-5 text-sm text-ceda-muted">
            No audit events have been recorded yet.
          </p>
        )}
      </div>
    </main>
  );
}
