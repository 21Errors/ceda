import Link from "next/link";
import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ideaVersions, ideas, innovationCalls } from "@/db/schema";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { GrantAwardForm } from "@/components/admin/GrantAwardForm";
import { requireRole } from "@/lib/authorization";

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
    db
      .select({
        id: ideas.id,
        referenceNo: ideas.referenceNo,
        title: ideaVersions.title,
        callTitle: innovationCalls.title,
      })
      .from(ideas)
      .innerJoin(ideaVersions, eq(ideas.currentVersionId, ideaVersions.id))
      .innerJoin(innovationCalls, eq(ideas.callId, innovationCalls.id))
      .where(eq(ideas.status, "approved"))
      .orderBy(desc(ideas.updatedAt)),
    searchParams,
  ]);
  const error =
    query.error === "unavailable"
      ? "This submission is no longer eligible for an award. Refresh the page and try again."
      : query.error === "configuration"
        ? "The opportunity needs an award workflow stage before an award can be granted."
        : query.error
          ? "Enter an award title and check the field limits."
          : "";

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#FFFDFC] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-275">
        <Link
          href="/admin"
          className="text-sm font-semibold text-ceda-burgundy underline underline-offset-4">
          ← Back to administration
        </Link>
        <header className="mt-5">
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
        {error && (
          <p
            className="mt-5 rounded-xl border border-red-800/25 bg-red-50 p-4 text-sm text-red-900"
            role="alert">
            {error}
          </p>
        )}
        {approved.length ? (
          <div className="mt-7 space-y-4">
            {approved.map((idea) => (
              <article
                key={idea.id}
                className="rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-6">
                <h2
                  id={`award-${idea.id}`}
                  className="text-xl font-bold text-ceda-ink">
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
