import { Suspense } from "react";
import { AdminCallsLedger } from "@/components/admin/overview/AdminCallsLedger";
import { AdminKpiStrip } from "@/components/admin/overview/AdminKpiStrip";
import { AdminOperationsPanel } from "@/components/admin/overview/AdminOperationsPanel";
import { AdminOverviewHeader } from "@/components/admin/overview/AdminOverviewHeader";
import { AdminPipelineSnapshot } from "@/components/admin/overview/AdminPipelineSnapshot";
import { AdminRecentActivity } from "@/components/admin/overview/AdminRecentActivity";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { requireRole } from "@/lib/authorization";
import { loadAdminOverviewData } from "@/lib/server/admin-overview";

export default function AdminPage() {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="dashboard" />}>
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  await requireRole("admin", "/admin");
  const data = await loadAdminOverviewData();

  return (
    <main id="main-content" className="flex-1 bg-[#F7F8F9]">
      <AdminOverviewHeader />

      <div className="mx-auto max-w-(--container-workspace) space-y-ds-6 px-gutter py-ds-6 sm:py-ds-8">
        <AdminKpiStrip
          openCallsCount={data.openCallsCount}
          activePipelineCount={data.activePipelineCount}
          pendingReviewsCount={data.pendingReviewsCount}
          totalUsersCount={data.totalUsersCount}
        />

        <div className="grid items-start gap-ds-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,1fr)]">
          <div className="min-w-0 space-y-ds-6">
            <AdminCallsLedger
              calls={data.calls}
              openCallsCount={data.openCallsCount}
            />
            <AdminRecentActivity entries={data.recentAudit} />
          </div>

          <aside aria-label="Portal operations and submission pipeline" className="space-y-ds-6">
            <AdminOperationsPanel
              totalUsersCount={data.totalUsersCount}
              activePipelineCount={data.activePipelineCount}
              awardsCount={data.awardsCount}
              activeCategoriesCount={data.activeCategoriesCount}
              publishedFaqsCount={data.publishedFaqsCount}
              publishedDocumentsCount={data.publishedDocumentsCount}
              publishedPagesCount={data.publishedPagesCount}
            />
            <AdminPipelineSnapshot
              breakdown={data.pipelineBreakdown}
              totalSubmissions={data.totalSubmissions}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
