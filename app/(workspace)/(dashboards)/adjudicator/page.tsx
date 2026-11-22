import { Suspense } from "react";
import { Download } from "lucide-react";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import {
  formatFileSize,
  getAttachmentDownloadPath,
  getAttachmentTypeLabel,
} from "@/lib/attachments";
import { AdjudicationDecisionForm } from "@/components/adjudicator/AdjudicationDecisionForm";
import { SimilarIdeasAlert } from "@/components/review/SimilarIdeasAlert";
import { requireRole } from "@/lib/authorization";
import { getAdjudicationQueue } from "@/lib/server/adjudicator-workspace";

export default function AdjudicatorPage({
  searchParams,
}: PageProps<"/adjudicator">) {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="list" />}>
      <AdjudicationContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdjudicationContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole("adjudicator", "/adjudicator");
  const query = await searchParams;
  const queue = await getAdjudicationQueue();
  const message =
    query.error === "rationale"
      ? "Enter a rationale of at least 20 characters."
      : query.error === "decided"
        ? "A decision already exists for the current version."
        : query.error
          ? "This submission is not available for adjudication."
          : "";

  return (
    <main
      id="main-content"
      className="flex-1 bg-white px-gutter py-ds-6 sm:py-ds-8">
      <div className="mx-auto w-full max-w-(--container-workspace)">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
          Adjudicator workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ceda-ink">
          Adjudication queue
        </h1>
        <p className="mt-2 text-sm text-ceda-muted">
          Review completed evaluations and record the decision for the current
          submission version.
        </p>
        {message && (
          <p
            className="mt-5 rounded-xl border border-red-800/25 bg-red-50 p-4 text-sm text-red-900"
            role="alert">
            {message}
          </p>
        )}
        {queue.length ? (
          <div className="mt-7 space-y-6">
            {queue.map((idea) => (
              <article
                key={idea.id}
                className="rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-7">
                <header>
                  <p className="text-xs font-bold uppercase tracking-wide text-ceda-burgundy">
                    {idea.referenceNo} · {idea.callTitle}
                  </p>
                  <h2
                    id={`adjudication-${idea.id}`}
                    className="mt-2 text-2xl font-bold text-ceda-ink">
                    {idea.title}
                  </h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ceda-body">
                    {idea.summary}
                  </p>
                </header>
                <div className="mt-4">
                  <SimilarIdeasAlert matches={idea.similarIdeas} compact />
                </div>
                {idea.reviews.length > 0 ? (
                  <section className="mt-5" aria-label="Evaluator reviews">
                    <h3 className="font-bold text-ceda-ink">
                      Evaluator reviews
                    </h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {idea.reviews.map((review, index) => (
                        <div
                          key={`${review.versionId}-${index}`}
                          className="rounded-xl bg-[#FFF9F4] p-4">
                          <p className="font-semibold text-ceda-ink">
                            {review.stageName} · {review.evaluatorName}
                          </p>
                          <p className="mt-1 text-sm font-bold text-ceda-burgundy">
                            {review.totalScore ?? "—"} / 100
                          </p>
                          {review.comment && (
                            <p className="mt-2 text-sm leading-6 text-ceda-body">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                ) : (
                  <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
                    No evaluation scores are attached to the current version.
                  </p>
                )}
                {idea.attachments.length > 0 && (
                  <section className="mt-5" aria-label="Supporting documents">
                    <h3 className="font-bold text-ceda-ink">
                      Supporting documents
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {idea.attachments.map((file) => (
                        <li
                          key={file.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ceda-line bg-[#FFFDFC] px-3.5 py-2.5">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-ceda-ink">
                              {file.fileName}
                            </span>
                            <span className="block text-xs text-ceda-muted">
                              {getAttachmentTypeLabel(
                                file.mimeType,
                                file.fileName,
                              )}{" "}
                              · {formatFileSize(file.fileSize)}
                            </span>
                          </span>
                          <a
                            href={getAttachmentDownloadPath(file.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-ceda-line bg-white px-3.5 text-xs font-semibold text-ceda-burgundy hover:bg-[#FFF9F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy">
                            <Download
                              aria-hidden="true"
                              className="h-3.5 w-3.5"
                            />
                            Download
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                <dl className="mt-5 divide-y divide-ceda-line border-t border-ceda-line">
                  {Object.entries(idea.answers ?? {}).map(([key, value]) => (
                    <div
                      key={key}
                      className="grid gap-1 py-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] sm:gap-5">
                      <dt className="text-sm font-semibold capitalize text-ceda-ink">
                        {key.replaceAll("_", " ")}
                      </dt>
                      <dd className="wrap-break-word text-sm leading-6 text-ceda-body">
                        {Array.isArray(value)
                          ? value.join(", ")
                          : typeof value === "boolean"
                            ? value
                              ? "Yes"
                              : "No"
                            : String(value ?? "—")}
                      </dd>
                    </div>
                  ))}
                </dl>
                <AdjudicationDecisionForm ideaId={idea.id} />
              </article>
            ))}
          </div>
        ) : (
          <section className="mt-7 rounded-2xl bg-[#FFF9F4] p-6">
            <h2 className="font-bold text-ceda-ink">
              No submissions are ready for adjudication
            </h2>
            <p className="mt-2 text-sm text-ceda-muted">
              Submissions move here automatically after the final evaluation
              stage is completed.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
