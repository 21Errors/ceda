import Link from "next/link";
import { asc } from "drizzle-orm";
import { Suspense } from "react";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { db } from "@/db";
import { innovationCalls } from "@/db/schema";
import {
  ATTACHMENT_ACCEPT_ATTRIBUTE,
  ATTACHMENT_ALLOWED_SUMMARY,
  MAX_ATTACHMENT_SIZE_LABEL,
  getAttachmentTypeLabel,
} from "@/lib/attachments";
import { requireRole } from "@/lib/authorization";
import { getDocumentDownloadPath } from "@/lib/portal-content";
import { getAllAdminDocuments } from "@/lib/server/portal-content";
import { isUploadsStorageConfigured } from "@/lib/storage";
import {
  createDocument,
  deleteDocument,
  updateDocument,
} from "./actions";

export default function AdminDocumentsPage({
  searchParams,
}: PageProps<"/admin/content/documents">) {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="list" />}>
      <AdminDocumentsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminDocumentsContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole("admin", "/admin/content/documents");
  const [items, calls, query] = await Promise.all([
    getAllAdminDocuments(),
    db
      .select({ id: innovationCalls.id, title: innovationCalls.title })
      .from(innovationCalls)
      .orderBy(asc(innovationCalls.title)),
    searchParams,
  ]);

  const storageReady = isUploadsStorageConfigured();
  const detail = Array.isArray(query.detail) ? query.detail[0] : query.detail;
  const notice =
    query.notice === "created"
      ? "Document template uploaded and published to Neon Object Storage."
      : query.notice === "saved"
        ? "Document template updated and public pages refreshed."
        : query.notice === "deleted"
          ? "Document template removed from portal and storage."
          : "";

  const errorMessage =
    query.error === "title"
      ? "Enter a document title between 1 and 255 characters."
      : query.error === "file"
        ? "Choose a template file to upload."
        : query.error === "upload"
          ? detail || "The uploaded file could not be accepted."
          : query.error === "notfound"
            ? "That document template no longer exists. Reload the page."
            : query.error
              ? "Please check the document details and try again."
              : "";

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#FFFDFC] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-250">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin"
            className="text-sm font-semibold text-ceda-burgundy underline underline-offset-4">
            ← Back to administration
          </Link>
          <Link
            href="/guidelines"
            className="text-sm font-semibold text-ceda-burgundy underline underline-offset-4">
            View public Guidelines page →
          </Link>
        </div>

        <header className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
            Portal content
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ceda-ink">
            Downloadable document templates
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ceda-muted">
            Upload application templates, financial schedules, and official
            guidelines backed by Neon Object Storage. Published templates appear
            on the public{" "}
            <Link
              href="/guidelines"
              className="font-semibold text-ceda-burgundy underline underline-offset-2">
              Guidelines
            </Link>{" "}
            page.
          </p>
        </header>

        {!storageReady && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-amber-600/30 bg-amber-50 p-4 text-sm text-amber-950">
            Neon Object Storage credentials (`AWS_ENDPOINT_URL_S3`,
            `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) are not configured in
            this environment. Uploads and downloads require storage credentials.
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-emerald-700/25 bg-emerald-50 p-4 text-sm text-emerald-900">
            {notice}
          </p>
        )}

        {errorMessage && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-800/25 bg-red-50 p-4 text-sm text-red-900">
            {errorMessage}
          </p>
        )}

        {/* Upload new template */}
        <section
          aria-labelledby="upload-doc-heading"
          className="mt-7 rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-7">
          <h2
            id="upload-doc-heading"
            className="flex items-center gap-2 text-xl font-bold text-ceda-ink">
            <Upload aria-hidden="true" className="h-5 w-5 text-ceda-burgundy" />
            Upload a document template
          </h2>
          <p className="mt-1 text-xs text-ceda-muted">
            Accepted formats: {ATTACHMENT_ALLOWED_SUMMARY} (max{" "}
            {MAX_ATTACHMENT_SIZE_LABEL}).
          </p>

          <form
            action={createDocument}
            className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="doc-title"
                className="block text-sm font-semibold text-ceda-ink">
                Template title
              </label>
              <input
                id="doc-title"
                name="title"
                type="text"
                required
                maxLength={255}
                placeholder="e.g. CEDA Innovation Pitch Deck Template"
                className="ds-input mt-1.5"
              />
            </div>

            <div>
              <label
                htmlFor="doc-call"
                className="block text-sm font-semibold text-ceda-ink">
                Innovation call (optional)
              </label>
              <select
                id="doc-call"
                name="callId"
                defaultValue=""
                className="ds-input mt-1.5">
                <option value="">General portal resource (all calls)</option>
                {calls.map((call) => (
                  <option key={call.id} value={call.id}>
                    {call.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="doc-file"
                className="block text-sm font-semibold text-ceda-ink">
                Template file
              </label>
              <input
                id="doc-file"
                name="file"
                type="file"
                required
                accept={ATTACHMENT_ACCEPT_ATTRIBUTE}
                className="mt-1.5 block w-full rounded-xl border border-ceda-line bg-[#FFFDFC] px-3 py-2.5 text-sm text-ceda-ink file:mr-3 file:rounded-full file:border-0 file:bg-ceda-cream-mid file:px-4 file:py-1.5 file:text-xs file:font-bold file:text-ceda-burgundy hover:file:bg-ceda-peach-light"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 sm:col-span-2">
              <label className="inline-flex items-center gap-2.5 text-sm text-ceda-ink">
                <input
                  type="checkbox"
                  name="isPublished"
                  value="true"
                  defaultChecked
                  className="h-4 w-4 accent-ceda-burgundy"
                />
                <span>Publish immediately on public Guidelines page</span>
              </label>

              <button
                type="submit"
                disabled={!storageReady}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white hover:bg-[#5C150D] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                <Upload aria-hidden="true" className="h-4 w-4" />
                Upload template
              </button>
            </div>
          </form>
        </section>

        {/* Existing documents */}
        <section
          aria-label="Uploaded document templates"
          className="mt-9 space-y-4">
          <h2 className="text-lg font-bold text-ceda-ink">
            Existing templates ({items.length})
          </h2>

          {items.map((doc) => (
            <article
              key={doc.id}
              className="rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ceda-line pb-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ceda-cream-mid text-ceda-burgundy">
                    <FileText aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-ceda-ink">
                      {doc.title}
                    </p>
                    <p className="mt-0.5 text-xs text-ceda-muted">
                      {doc.fileName} ·{" "}
                      {getAttachmentTypeLabel(null, doc.fileName)} · Uploaded{" "}
                      {doc.createdAt.toLocaleDateString("en-BW", {
                        dateStyle: "medium",
                        timeZone: "Africa/Gaborone",
                      })}
                      {doc.uploaderName ? ` by ${doc.uploaderName}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      doc.isPublished
                        ? "bg-emerald-50 text-emerald-900"
                        : "bg-surface-muted text-ceda-muted"
                    }`}>
                    {doc.isPublished ? "Published" : "Hidden"}
                  </span>
                  <a
                    href={getDocumentDownloadPath(doc.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-ceda-line bg-white px-4 text-xs font-semibold text-ceda-burgundy hover:bg-[#FFF9F4]">
                    <Download aria-hidden="true" className="h-3.5 w-3.5" />
                    Download
                  </a>
                </div>
              </div>

              <form
                action={updateDocument}
                className="mt-4 grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="documentId" value={doc.id} />
                <div>
                  <label
                    htmlFor={`title-${doc.id}`}
                    className="block text-xs font-semibold text-ceda-ink">
                    Title
                  </label>
                  <input
                    id={`title-${doc.id}`}
                    name="title"
                    type="text"
                    required
                    maxLength={255}
                    defaultValue={doc.title}
                    className="ds-input mt-1"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`call-${doc.id}`}
                    className="block text-xs font-semibold text-ceda-ink">
                    Innovation call
                  </label>
                  <select
                    id={`call-${doc.id}`}
                    name="callId"
                    defaultValue={doc.callId ?? ""}
                    className="ds-input mt-1">
                    <option value="">General portal resource (all calls)</option>
                    {calls.map((call) => (
                      <option key={call.id} value={call.id}>
                        {call.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor={`replace-${doc.id}`}
                    className="block text-xs font-semibold text-ceda-ink">
                    Replace file (optional)
                  </label>
                  <input
                    id={`replace-${doc.id}`}
                    name="file"
                    type="file"
                    accept={ATTACHMENT_ACCEPT_ATTRIBUTE}
                    className="mt-1 block w-full rounded-xl border border-ceda-line bg-[#FFFDFC] px-3 py-2 text-xs text-ceda-ink file:mr-3 file:rounded-full file:border-0 file:bg-ceda-cream-mid file:px-3 file:py-1 file:text-xs file:font-bold file:text-ceda-burgundy"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm text-ceda-ink">
                    <input
                      type="checkbox"
                      name="isPublished"
                      value="true"
                      defaultChecked={doc.isPublished}
                      className="h-4 w-4 accent-ceda-burgundy"
                    />
                    <span>Visible publicly</span>
                  </label>

                  <button
                    type="submit"
                    className="inline-flex min-h-10 items-center rounded-full bg-ceda-burgundy px-5 text-xs font-bold text-white hover:bg-[#5C150D]">
                    Save changes
                  </button>
                </div>
              </form>

              <form
                action={deleteDocument}
                aria-label={`Delete template: ${doc.title}`}
                className="mt-3 border-t border-ceda-line pt-3">
                <input type="hidden" name="documentId" value={doc.id} />
                <button
                  type="submit"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-red-800/30 px-4 text-xs font-semibold text-red-900 hover:bg-red-50">
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                  Delete template
                </button>
              </form>
            </article>
          ))}

          {items.length === 0 && (
            <p className="rounded-xl border border-ceda-line bg-white p-6 text-sm text-ceda-muted">
              No downloadable document templates have been uploaded yet.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
