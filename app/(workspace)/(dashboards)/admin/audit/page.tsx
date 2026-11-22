import { Suspense } from "react";
import { AuditTrailList } from "@/components/admin/audit/AuditTrailList";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { requireRole } from "@/lib/authorization";
import { loadAuditEntries } from "@/lib/server/admin-governance";

export default function AuditPage() {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="list" />}>
      <AuditContent />
    </Suspense>
  );
}

async function AuditContent() {
  await requireRole("admin", "/admin/audit");
  const entries = await loadAuditEntries(200);

  return (
    <main
      id="main-content"
      className="flex-1 bg-white px-gutter py-ds-6 sm:py-ds-8"
    >
      <div className="mx-auto w-full max-w-(--container-workspace)">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
            Governance
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ceda-ink">Audit trail</h1>
          <p className="mt-2 text-sm leading-6 text-ceda-muted">
            Recent recorded account, workflow and support actions. Showing the
            latest 200 entries.
          </p>
        </header>

        <AuditTrailList entries={entries} />
      </div>
    </main>
  );
}
