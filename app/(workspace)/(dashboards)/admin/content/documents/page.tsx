import Link from "next/link";
import { Suspense } from "react";
import { DocumentTemplateCard } from "@/components/admin/content/DocumentTemplateCard";
import { DocumentUploadSection } from "@/components/admin/content/DocumentUploadSection";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { resolveDocumentsAdminFeedback } from "@/lib/admin-messages";
import { requireRole } from "@/lib/authorization";
import { loadCallOptionsForDocuments } from "@/lib/server/admin-content";
import { getAllAdminDocuments } from "@/lib/server/portal-content";
import { isUploadsStorageConfigured } from "@/lib/storage";

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
    loadCallOptionsForDocuments(),
    searchParams,
  ]);

  const storageReady = isUploadsStorageConfigured();
  const { notice, errorMessage } = resolveDocumentsAdminFeedback(query);

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#FFFDFC] px-gutter py-ds-6 sm:py-ds-8"
    >
      <div className="mx-auto w-full max-w-(--container-workspace)">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/guidelines"
            className="text-sm font-semibold text-ceda-burgundy underline underline-offset-4"
          >
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
              className="font-semibold text-ceda-burgundy underline underline-offset-2"
            >
              Guidelines
            </Link>{" "}
            page.
          </p>
        </header>

        {!storageReady ? (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-amber-600/30 bg-amber-50 p-4 text-sm text-amber-950"
          >
            Neon Object Storage credentials (`AWS_ENDPOINT_URL_S3`,
            `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) are not configured in
            this environment. Uploads and downloads require storage credentials.
          </p>
        ) : null}

        {notice ? (
          <p
            role="status"
            className="mt-5 rounded-xl border border-emerald-700/25 bg-emerald-50 p-4 text-sm text-emerald-900"
          >
            {notice}
          </p>
        ) : null}

        {errorMessage ? (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-800/25 bg-red-50 p-4 text-sm text-red-900"
          >
            {errorMessage}
          </p>
        ) : null}

        <DocumentUploadSection calls={calls} storageReady={storageReady} />

        <section
          aria-label="Uploaded document templates"
          className="mt-9 space-y-4"
        >
          <h2 className="text-lg font-bold text-ceda-ink">
            Existing templates ({items.length})
          </h2>

          {items.map((doc) => (
            <DocumentTemplateCard key={doc.id} doc={doc} calls={calls} />
          ))}

          {items.length === 0 ? (
            <p className="rounded-xl border border-ceda-line bg-white p-6 text-sm text-ceda-muted">
              No downloadable document templates have been uploaded yet.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
