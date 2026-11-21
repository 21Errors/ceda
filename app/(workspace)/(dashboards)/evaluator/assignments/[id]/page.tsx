import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { EvaluationForm } from "@/components/evaluator/EvaluationForm";
import { requireRole } from "@/lib/authorization";
import { getEvaluatorAssignment } from "@/lib/server/evaluator-workspace";

export default function EvaluationAssignmentPage({ params }: PageProps<"/evaluator/assignments/[id]">) {
  return <Suspense fallback={<WorkspacePageSkeleton variant="detail" />}><EvaluationContent params={params} /></Suspense>;
}

async function EvaluationContent({ params }: { params: Promise<{ id: string }> }) {
  const evaluator = await requireRole("evaluator", "/evaluator");
  const { id } = await params;
  const result = await getEvaluatorAssignment(id, evaluator.id);
  if (!result) notFound();

  return <main id="main-content" className="flex-1 bg-white px-4 py-10 sm:px-6 sm:py-14"><div className="mx-auto max-w-3xl">
    <Link href="/evaluator" className="text-sm font-semibold text-ceda-burgundy underline underline-offset-4">← Back to my reviews</Link>
    <header className="mt-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">{result.assignment.callTitle}</p><h1 className="mt-2 text-3xl font-bold text-ceda-ink">Evaluation · {result.assignment.stageName}</h1></header>
    <div className="mt-7">{result.assignment.status === "submitted" ? <section className="rounded-2xl border border-ceda-line bg-[#FFF9F4] p-6"><h2 className="font-bold text-ceda-ink">This evaluation has already been submitted</h2><p className="mt-2 text-sm text-ceda-muted">The submitted score is attached to the version you reviewed.</p></section> : result.criteria.length ? <EvaluationForm assignmentId={result.assignment.id} versionId={result.assignment.currentVersionId} referenceNo={result.assignment.referenceNo} stageName={result.assignment.stageName} title={result.assignment.title} summary={result.assignment.summary} categoryName={result.assignment.categoryName} versionNo={result.assignment.versionNo} answers={result.assignment.answers ?? {}} submissionFields={result.submissionFields} submissionAttachments={result.submissionAttachments} criteria={result.criteria} internalNotes={result.internalNotes} /> : <section className="rounded-2xl border border-amber-700/25 bg-amber-50 p-6"><h2 className="font-bold text-amber-950">Scoring criteria are not configured</h2><p className="mt-2 text-sm text-amber-900">Contact a portal administrator to configure this evaluation stage.</p></section>}</div>
  </div></main>;
}
