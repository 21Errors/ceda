import Link from "next/link";
import { Suspense } from "react";
import { NewCallForm } from "@/components/admin/NewCallForm";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { requireRole } from "@/lib/authorization";

export default function NewCallPage({ searchParams }: PageProps<"/admin/calls/new">) {
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
  const params = await searchParams;
  const error = params.error;
  const errorText =
    error === "title"
      ? "Enter a title between 3 and 255 characters."
      : error === "slug"
        ? "Use a slug with lowercase letters, numbers, and hyphens."
        : error === "duplicate"
          ? "That URL slug is already used by another call."
          : error === "dates"
            ? "Check the opening and closing dates; closing must be later."
            : error
              ? "Check the call details and try again."
              : "";

  return (
    <main id="main-content" className="flex-1 bg-white px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin"
          className="text-sm font-semibold text-ceda-burgundy underline underline-offset-4"
        >
          ← Back to administration
        </Link>
        <h1 id="create-call-heading" className="mt-5 text-3xl font-bold text-ceda-ink">
          Create an innovation call
        </h1>
        <p className="mt-2 text-sm leading-6 text-ceda-muted">
          New calls start with a standard review workflow. You can configure the submission form after creating the call.
        </p>
        {errorText ? (
          <p
            className="mt-5 rounded-xl border border-red-800/25 bg-red-50 p-4 text-sm text-red-900"
            role="alert"
          >
            {errorText}
          </p>
        ) : null}
        <NewCallForm />
      </div>
    </main>
  );
}
