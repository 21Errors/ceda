import Link from "next/link";
import { Suspense } from "react";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { requireRole } from "@/lib/authorization";
import {
  getAvailableEvaluatorIdeas,
  getEvaluatorAssignments,
} from "@/lib/server/evaluator-workspace";
import { claimEvaluation } from "@/app/(workspace)/(dashboards)/evaluator/assignments/actions";

export default function EvaluatorPage() {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="cards" />}>
      <EvaluatorContent />
    </Suspense>
  );
}

async function EvaluatorContent() {
  const evaluator = await requireRole("evaluator", "/evaluator");
  const [assignments, availableIdeas] = await Promise.all([
    getEvaluatorAssignments(evaluator.id),
    getAvailableEvaluatorIdeas(evaluator.id),
  ]);
  const openAssignments = assignments.filter(
    (assignment) => assignment.status !== "submitted",
  );
  const submittedAssignments = assignments.filter(
    (assignment) => assignment.status === "submitted",
  );

  return (
    <main
      id="main-content"
      className="flex-1 bg-white px-gutter py-ds-6 sm:py-ds-8">
      <div className="mx-auto w-full max-w-(--container-workspace)">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
          Evaluator workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ceda-ink">
          Evaluation queue
        </h1>
        <p className="mt-2 text-sm text-ceda-muted">
          Available submissions are shared among evaluators. Claim one to start
          reviewing it; the first claim reserves it for you.
        </p>
        <section className="mt-8" aria-labelledby="open-reviews-heading">
          <h2
            id="open-reviews-heading"
            className="text-xl font-bold text-ceda-ink">
            Your active reviews{" "}
            <span className="ml-2 rounded-full bg-[#FFF1E4] px-2.5 py-1 text-sm text-ceda-burgundy">
              {openAssignments.length}
            </span>
          </h2>
          {openAssignments.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {openAssignments.map((assignment) => (
                <article
                  key={assignment.id}
                  className="rounded-2xl border border-ceda-line bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-ceda-burgundy">
                    {assignment.referenceNo} · {assignment.stageName}
                  </p>
                  <h3 className="mt-3 text-xl font-bold text-ceda-ink">
                    {assignment.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ceda-muted line-clamp-3">
                    {assignment.summary}
                  </p>
                  <p className="mt-4 text-xs capitalize text-ceda-body">
                    {assignment.callTitle} ·{" "}
                    {assignment.status.replaceAll("_", " ")}
                  </p>
                  <Link
                    href={`/evaluator/assignments/${assignment.id}`}
                    className="mt-5 inline-flex min-h-11 items-center rounded-full bg-ceda-burgundy px-5 text-sm font-bold text-white hover:bg-[#5C150D]">
                    Open review
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-[#FFF9F4] p-6 text-sm text-ceda-muted">
              No reviews are waiting for you.
            </p>
          )}
        </section>
        <section className="mt-9" aria-labelledby="available-reviews-heading">
          <h2
            id="available-reviews-heading"
            className="text-xl font-bold text-ceda-ink">
            Available to claim{" "}
            <span className="ml-2 rounded-full bg-[#FFF1E4] px-2.5 py-1 text-sm text-ceda-burgundy">
              {availableIdeas.length}
            </span>
          </h2>
          {availableIdeas.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {availableIdeas.map((idea) => (
                <article
                  key={idea.ideaId}
                  className="rounded-2xl border border-ceda-line bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-ceda-burgundy">
                    {idea.referenceNo} · {idea.stageName}
                  </p>
                  <h3 className="mt-3 text-xl font-bold text-ceda-ink">
                    {idea.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-ceda-muted">
                    {idea.summary}
                  </p>
                  <p className="mt-4 text-xs text-ceda-body">
                    {idea.callTitle}
                    {idea.categoryName ? ` · ${idea.categoryName}` : ""}
                  </p>
                  <form action={claimEvaluation} className="mt-5">
                    <input type="hidden" name="ideaId" value={idea.ideaId} />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center rounded-full bg-ceda-burgundy px-5 text-sm font-bold text-white hover:bg-[#5C150D]">
                      Claim review
                    </button>
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-[#FFF9F4] p-6 text-sm text-ceda-muted">
              There are no submissions available to claim right now.
            </p>
          )}
        </section>
        {submittedAssignments.length > 0 && (
          <section className="mt-9" aria-labelledby="completed-reviews-heading">
            <h2
              id="completed-reviews-heading"
              className="text-xl font-bold text-ceda-ink">
              Completed reviews
            </h2>
            <ul className="mt-4 divide-y divide-ceda-line rounded-2xl border border-ceda-line">
              {submittedAssignments.map((assignment) => (
                <li
                  key={assignment.id}
                  className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    <span className="font-semibold text-ceda-ink">
                      {assignment.referenceNo} · {assignment.title}
                    </span>
                    <span className="mt-1 block text-xs text-ceda-muted">
                      {assignment.stageName} · {assignment.callTitle}
                    </span>
                  </span>
                  <span className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-green-800">
                      Submitted
                    </span>
                    <Link
                      href={`/evaluator/assignments/${assignment.id}`}
                      className="font-semibold text-ceda-burgundy underline underline-offset-4">
                      View review
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
