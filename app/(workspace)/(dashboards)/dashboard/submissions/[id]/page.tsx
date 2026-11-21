import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Download, FileText } from "lucide-react";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { ResubmissionForm } from "@/components/submit/ResubmissionForm";
import {
  formatFileSize,
  getAttachmentDownloadPath,
  getAttachmentTypeLabel,
} from "@/lib/attachments";
import { requireRole } from "@/lib/authorization";
import { getVersionAttachments } from "@/lib/server/attachments";
import {
  getActiveCategories,
  getPublicIdeaFeedback,
  getSubmissionFields,
  getSubmitterAwards,
  getSubmitterEvaluationFeedback,
  getSubmitterIdea,
  getSubmitterStageHistory,
} from "@/lib/server/idea-submission";

function AnswerContent({ value }: { value: unknown }) {
  if (Array.isArray(value)) return <>{value.join(", ")}</>;
  if (typeof value === "boolean") return <>{value ? "Yes" : "No"}</>;
  if (typeof value === "string") {
    let safeUrl: string | null = null;
    try {
      const url = new URL(value);
      if (url.protocol === "https:" || url.protocol === "http:")
        safeUrl = url.href;
    } catch {
      /* Plain text answer. */
    }
    if (safeUrl)
      return (
        <a
          href={safeUrl}
          target="_blank"
          rel="noreferrer"
          className="break-all font-semibold text-ceda-burgundy underline underline-offset-4">
          {value}
        </a>
      );
    return <>{value || "—"}</>;
  }
  return <>{String(value ?? "—")}</>;
}

export default function SubmissionDetailPage({
  params,
}: PageProps<"/dashboard/submissions/[id]">) {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="detail" />}>
      <SubmissionDetail params={params} />
    </Suspense>
  );
}

async function SubmissionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("submitter", "/dashboard");
  const { id } = await params;
  const idea = await getSubmitterIdea(id, user.id);
  if (!idea) notFound();

  const [
    history,
    publicFeedback,
    evaluationFeedback,
    userAwards,
    versionAttachments,
    fields,
    categories,
  ] = await Promise.all([
    getSubmitterStageHistory(id, user.id),
    getPublicIdeaFeedback(id, user.id),
    getSubmitterEvaluationFeedback(id, user.id),
    getSubmitterAwards(id, user.id),
    getVersionAttachments(idea.currentVersionId),
    idea.status === "changes_requested"
      ? getSubmissionFields(idea.callId)
      : Promise.resolve([]),
    idea.status === "changes_requested"
      ? getActiveCategories()
      : Promise.resolve([]),
  ]);
  const answers = Object.entries(idea.answers ?? {});
  return (
    <main
      id="main-content"
      className="flex-1 bg-white px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-ceda-burgundy underline underline-offset-4">
          ← Back to my submissions
        </Link>
        <header className="mt-6 rounded-2xl bg-[#5C150D] p-6 text-white sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F4B58A]">
            {idea.referenceNo}
          </p>
          <h1 className="mt-3 text-3xl font-bold">
            {idea.title ?? "Untitled idea"}
          </h1>
          <p className="mt-3 text-sm text-white/80">
            {idea.callTitle}
            {idea.versionNo ? ` · Version ${idea.versionNo}` : ""}
          </p>
          <span className="mt-5 inline-flex rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold capitalize">
            {idea.status.replaceAll("_", " ")}
          </span>
        </header>
        <section
          className="mt-6 rounded-2xl border border-ceda-line bg-white p-6 sm:p-8"
          aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="text-xl font-bold text-ceda-ink">
            Idea summary
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ceda-body">
            {idea.summary}
          </p>
        </section>
        {versionAttachments.length > 0 && (
          <section
            className="mt-6 rounded-2xl border border-ceda-line bg-white p-6 sm:p-8"
            aria-labelledby="documents-heading">
            <h2
              id="documents-heading"
              className="text-xl font-bold text-ceda-ink">
              Supporting documents
            </h2>
            <p className="mt-1 text-sm text-ceda-muted">
              Files attached to the current version. Downloads use short-lived
              private links.
            </p>
            <ul className="mt-4 space-y-2.5">
              {versionAttachments.map((file) => (
                <li
                  key={file.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ceda-line bg-[#FFFDFC] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 text-ceda-burgundy"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ceda-ink">
                        {file.fileName}
                      </p>
                      <p className="text-xs text-ceda-muted">
                        {getAttachmentTypeLabel(file.mimeType, file.fileName)} ·{" "}
                        {formatFileSize(file.fileSize)}
                      </p>
                    </div>
                  </div>
                  <a
                    href={getAttachmentDownloadPath(file.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ceda-line bg-white px-4 text-xs font-semibold text-ceda-burgundy hover:bg-[#FFF9F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy">
                    <Download aria-hidden="true" className="h-3.5 w-3.5" />
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
        {userAwards.length > 0 && (
          <section
            className="mt-6 rounded-2xl border border-[#E8B36D] bg-[#FFF9F0] p-6 sm:p-8"
            aria-labelledby="awards-heading">
            <h2 id="awards-heading" className="text-xl font-bold text-ceda-ink">
              Recognition
            </h2>
            <ul className="mt-4 space-y-4">
              {userAwards.map((award, index) => (
                <li key={`${award.title}-${index}`}>
                  <p className="font-semibold text-ceda-burgundy">
                    {award.title}
                    {award.tier ? ` · ${award.tier}` : ""}
                  </p>
                  {award.description && (
                    <p className="mt-1 text-sm leading-6 text-ceda-body">
                      {award.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-ceda-muted">
                    Awarded{" "}
                    {award.awardedAt.toLocaleDateString("en-BW", {
                      dateStyle: "long",
                      timeZone: "Africa/Gaborone",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
        {answers.length > 0 && (
          <section
            className="mt-6 rounded-2xl border border-ceda-line bg-white p-6 sm:p-8"
            aria-labelledby="details-heading">
            <h2
              id="details-heading"
              className="text-xl font-bold text-ceda-ink">
              Additional information
            </h2>
            <dl className="mt-4 divide-y divide-ceda-line">
              {answers.map(([key, value]) => (
                <div
                  key={key}
                  className="grid gap-1 py-4 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] sm:gap-5">
                  <dt className="text-sm font-semibold capitalize text-ceda-ink">
                    {key.replaceAll("_", " ")}
                  </dt>
                  <dd className="wrap-break-word text-sm leading-6 text-ceda-body">
                    <AnswerContent value={value} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        {history.length > 0 && (
          <section
            className="mt-6 rounded-2xl border border-ceda-line bg-white p-6 sm:p-8"
            aria-labelledby="timeline-heading">
            <h2
              id="timeline-heading"
              className="text-xl font-bold text-ceda-ink">
              Progress timeline
            </h2>
            <ol className="mt-5 space-y-4">
              {history.map((item, index) => (
                <li key={item.id} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF1E4] text-xs font-bold text-ceda-burgundy">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block font-semibold capitalize text-ceda-ink">
                      {item.stageName ?? item.status.replaceAll("_", " ")}
                    </span>
                    <span className="text-sm capitalize text-ceda-muted">
                      {item.status.replaceAll("_", " ")} ·{" "}
                      {item.createdAt.toLocaleDateString("en-BW", {
                        dateStyle: "medium",
                        timeZone: "Africa/Gaborone",
                      })}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}
        {evaluationFeedback.length > 0 && (
          <section
            className="mt-6 rounded-2xl border border-ceda-line bg-white p-6 sm:p-8"
            aria-labelledby="evaluation-feedback-heading">
            <h2
              id="evaluation-feedback-heading"
              className="text-xl font-bold text-ceda-ink">
              Evaluator feedback
            </h2>
            <p className="mt-1 text-sm text-ceda-muted">
              Written comments from completed reviews. Evaluator-only notes
              remain private.
            </p>
            <div className="mt-4 space-y-4">
              {evaluationFeedback.map((review) => (
                <article
                  key={review.id}
                  className="rounded-xl bg-[#FFF9F4] p-4">
                  <p className="text-xs font-semibold text-ceda-burgundy">
                    {review.stageName} · Version {review.versionNo} · Submitted{" "}
                    {review.submittedAt.toLocaleDateString("en-BW", {
                      dateStyle: "medium",
                      timeZone: "Africa/Gaborone",
                    })}
                  </p>
                  {review.overallComment && (
                    <div className="mt-3">
                      <h3 className="text-sm font-semibold text-ceda-ink">
                        Overall feedback
                      </h3>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ceda-body">
                        {review.overallComment}
                      </p>
                    </div>
                  )}
                  {review.criterionComments.length > 0 && (
                    <ul className="mt-3 space-y-3">
                      {review.criterionComments.map((comment, index) => (
                        <li key={`${comment.name}-${index}`}>
                          <h3 className="text-sm font-semibold text-ceda-ink">
                            {comment.name}
                          </h3>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ceda-body">
                            {comment.comment}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!review.overallComment &&
                    review.criterionComments.length === 0 && (
                      <p className="mt-3 text-sm text-ceda-muted">
                        No written comments were included in this review.
                      </p>
                    )}
                </article>
              ))}
            </div>
          </section>
        )}
        {publicFeedback.length > 0 && (
          <section
            className="mt-6 rounded-2xl border border-ceda-line bg-white p-6 sm:p-8"
            aria-labelledby="feedback-heading">
            <h2
              id="feedback-heading"
              className="text-xl font-bold text-ceda-ink">
              Feedback and replies
            </h2>
            <div className="mt-4 space-y-3">
              {publicFeedback.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-xl bg-[#FFF9F4] p-4 ${item.parentId ? "ml-5 border-l-2 border-ceda-orange sm:ml-10" : ""}`}>
                  <p className="text-xs font-semibold text-ceda-burgundy">
                    {item.authorName} ·{" "}
                    {item.createdAt.toLocaleDateString("en-BW", {
                      dateStyle: "medium",
                      timeZone: "Africa/Gaborone",
                    })}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ceda-body">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
        {idea.status === "changes_requested" && (
          <div className="mt-6">
            <ResubmissionForm
              ideaId={idea.id}
              title={idea.title ?? ""}
              summary={idea.summary ?? ""}
              answers={idea.answers ?? {}}
              categoryId={idea.categoryId}
              fields={fields}
              categories={categories}
              existingAttachments={versionAttachments}
            />
          </div>
        )}
        <p className="mt-5 text-xs text-ceda-muted">
          Submitted{" "}
          {idea.submittedAt
            ? idea.submittedAt.toLocaleDateString("en-BW", {
                dateStyle: "long",
                timeZone: "Africa/Gaborone",
              })
            : "—"}
        </p>
      </div>
    </main>
  );
}
