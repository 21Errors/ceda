import { Suspense } from "react";
import { NewCallForm } from "@/components/admin/NewCallForm";
import { NewCallGuidePanel } from "@/components/admin/calls/NewCallGuidePanel";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { resolveNewCallError } from "@/lib/admin-messages";
import { requireRole } from "@/lib/authorization";

export default function NewCallPage({
  searchParams,
}: PageProps<"/admin/calls/new">) {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="form" />}>
      <NewCallContent searchParams={searchParams} />
    </Suspense>
  );
}

async function NewCallContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole("admin", "/admin/calls/new");
  const errorText = resolveNewCallError(await searchParams);

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#F7F8F9] px-gutter py-ds-6 sm:py-ds-8"
    >
      <div className="mx-auto w-full max-w-(--container-workspace)">
        <h1
          id="create-call-heading"
          className="text-3xl font-bold text-ceda-ink"
        >
          Create an innovation call
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ceda-muted">
          New calls start with a standard review workflow. You can set up the
          application form after creating the call.
        </p>

        {errorText ? (
          <p
            className="mt-5 rounded-xl border border-red-800/25 bg-red-50 p-4 text-sm text-red-900"
            role="alert"
          >
            {errorText}
          </p>
        ) : null}

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <NewCallForm />
          <NewCallGuidePanel />
        </div>
      </div>
    </main>
  );
}
