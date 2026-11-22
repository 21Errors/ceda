import { Suspense } from "react";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { requireRole } from "@/lib/authorization";
import { loadAdminReviewPipeline } from "@/lib/server/admin-governance";

export default function AdminReviewsPage() {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="list" />}>
      <ReviewPipeline />
    </Suspense>
  );
}

async function ReviewPipeline() {
  await requireRole("admin", "/admin/reviews");
  const submissions = await loadAdminReviewPipeline(200);

  return (
    <main
      id="main-content"
      className="flex-1 bg-white px-gutter py-ds-6 sm:py-ds-8"
    >
      <div className="mx-auto w-full max-w-(--container-workspace)">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
            Evaluation progress
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ceda-ink">
            Review pipeline
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ceda-muted">
            Submissions move through the evaluation queue automatically.
            Evaluators claim available work themselves; administrators manage
            staff roles under Manage users and roles.
          </p>
        </header>

        <div className="mt-7 space-y-4">
          {submissions.map((idea) => (
            <article
              key={idea.id}
              className="rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-6"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-ceda-burgundy">
                {idea.referenceNo} · {idea.status.replaceAll("_", " ")}
              </p>
              <h2 className="mt-2 text-xl font-bold text-ceda-ink">
                {idea.title ?? "Untitled idea"}
              </h2>
              <p className="mt-1 text-sm text-ceda-muted">
                {idea.callTitle} · {idea.stageName ?? "No active stage"}
              </p>
              <ul className="mt-3 space-y-1 text-xs text-ceda-body">
                {idea.assignments.map((assignment, index) => (
                  <li key={`${assignment.name}-${index}`}>
                    {assignment.name} · {assignment.status.replaceAll("_", " ")}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {!submissions.length ? (
          <p className="mt-7 rounded-2xl bg-[#FFF9F4] p-6 text-sm text-ceda-muted">
            No active submissions are in the review pipeline.
          </p>
        ) : null}
      </div>
    </main>
  );
}
