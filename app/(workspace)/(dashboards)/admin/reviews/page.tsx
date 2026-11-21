import Link from "next/link";
import { Suspense } from "react";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  evaluatorAssignments,
  ideaVersions,
  ideas,
  innovationCalls,
  user,
  workflowStages,
} from "@/db/schema";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { requireRole } from "@/lib/authorization";

export default function AdminReviewsPage() {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="list" />}>
      <ReviewPipeline />
    </Suspense>
  );
}

async function ReviewPipeline() {
  await requireRole("admin", "/admin/reviews");
  const submissions = await db
    .select({
      id: ideas.id,
      referenceNo: ideas.referenceNo,
      status: ideas.status,
      callTitle: innovationCalls.title,
      title: ideaVersions.title,
      stageName: workflowStages.name,
    })
    .from(ideas)
    .innerJoin(innovationCalls, eq(ideas.callId, innovationCalls.id))
    .leftJoin(ideaVersions, eq(ideas.currentVersionId, ideaVersions.id))
    .leftJoin(workflowStages, eq(ideas.currentStageId, workflowStages.id))
    .where(
      inArray(ideas.status, ["submitted", "in_review", "changes_requested"]),
    )
    .orderBy(desc(ideas.submittedAt))
    .limit(200);
  const activeIds = submissions.map((item) => item.id);
  const assignments = activeIds.length
    ? await db
        .select({
          ideaId: evaluatorAssignments.ideaId,
          name: user.name,
          status: evaluatorAssignments.status,
        })
        .from(evaluatorAssignments)
        .innerJoin(user, eq(evaluatorAssignments.evaluatorId, user.id))
        .where(inArray(evaluatorAssignments.ideaId, activeIds))
    : [];
  const byIdea = new Map<string, typeof assignments>();
  assignments.forEach((assignment) =>
    byIdea.set(assignment.ideaId, [
      ...(byIdea.get(assignment.ideaId) ?? []),
      assignment,
    ]),
  );

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
              className="rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-6">
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
                {(byIdea.get(idea.id) ?? []).map((assignment, index) => (
                  <li key={`${assignment.name}-${index}`}>
                    {assignment.name} · {assignment.status.replaceAll("_", " ")}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        {!submissions.length && (
          <p className="mt-7 rounded-2xl bg-[#FFF9F4] p-6 text-sm text-ceda-muted">
            No active submissions are in the review pipeline.
          </p>
        )}
      </div>
    </main>
  );
}
