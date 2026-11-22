import { Suspense } from "react";
import { GrantAwardForm } from "@/components/admin/GrantAwardForm";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { resolveAwardsError } from "@/lib/admin-messages";
import { requireRole } from "@/lib/authorization";
import { loadApprovedIdeasForAwards } from "@/lib/server/admin-governance";

export default function AdminAwardsPage({
  searchParams,
}: PageProps<"/admin/awards">) {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="list" />}>
      <AwardsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AwardsContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole("admin", "/admin/awards");
  const [approved, query] = await Promise.all([
    loadApprovedIdeasForAwards(),
    searchParams,
  ]);
  const error = resolveAwardsError(query);

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#FFFDFC] px-gutter py-ds-6 sm:py-ds-8"
    >
      <div className="mx-auto w-full max-w-(--container-workspace)">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
            Recognition
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ceda-ink">
            Grant awards
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ceda-muted">
            Record recognition for approved ideas. Granting an award moves the
            submission to the final award stage and notifies the submitter in
            the portal.
          </p>
        </header>

        {error ? (
          <p
            className="mt-5 rounded-xl border border-red-800/25 bg-red-50 p-4 text-sm text-red-900"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {approved.length ? (
          <div className="mt-7 space-y-4">
            {approved.map((idea) => (
              <article
                key={idea.id}
                className="rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-6"
              >
                <h2
                  id={`award-${idea.id}`}
                  className="text-xl font-bold text-ceda-ink"
                >
                  {idea.title}
                </h2>
                <p className="mt-1 text-sm text-ceda-muted">
                  {idea.referenceNo} · {idea.callTitle}
                </p>
                <GrantAwardForm ideaId={idea.id} />
              </article>
            ))}
          </div>
        ) : (
          <section className="mt-7 rounded-2xl border border-ceda-line bg-white p-6">
            <h2 className="font-bold text-ceda-ink">
              No approved ideas need an award
            </h2>
            <p className="mt-2 text-sm text-ceda-muted">
              Once an adjudicator approves a submission, it will appear here.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
