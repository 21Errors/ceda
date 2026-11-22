import { Suspense } from "react";
import { AdminCallsHeader } from "@/components/admin/calls/list/AdminCallsHeader";
import { AdminCallsListClient } from "@/components/admin/calls/list/AdminCallsListClient";
import { AdminCallsSummaryBar } from "@/components/admin/calls/list/AdminCallsSummaryBar";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { requireRole } from "@/lib/authorization";
import { loadAdminCallsList } from "@/lib/server/admin-calls";

export default function AdminCallsListPage() {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="list" />}>
      <AdminCallsListContent />
    </Suspense>
  );
}

async function AdminCallsListContent() {
  await requireRole("admin", "/admin/calls");
  const calls = await loadAdminCallsList();

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#F7F8F9] px-gutter py-ds-6 sm:py-ds-8"
    >
      <div className="mx-auto w-full max-w-(--container-workspace) space-y-6">
        <AdminCallsHeader totalCount={calls.length} />
        <AdminCallsSummaryBar calls={calls} />
        <AdminCallsListClient calls={calls} />
      </div>
    </main>
  );
}
