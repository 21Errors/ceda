import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CallConfigHeader } from "@/components/admin/calls/config/CallConfigHeader";
import { CallConfigWizard } from "@/components/admin/calls/config/CallConfigWizard";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import {
  resolveCallConfigError,
  resolveCallConfigStep,
} from "@/lib/admin-messages";
import { requireRole } from "@/lib/authorization";
import { loadAdminCallConfig } from "@/lib/server/admin-call-config";

export default function CallConfigurationPage({
  params,
  searchParams,
}: PageProps<"/admin/calls/[id]">) {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="detail" />}>
      <CallConfigurationContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CallConfigurationContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole("admin", "/admin");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const data = await loadAdminCallConfig(id);
  if (!data) notFound();

  const errorText = resolveCallConfigError(query);
  const initialStep = resolveCallConfigStep(query);

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#F7F8F9] px-gutter py-ds-6 sm:py-ds-8"
    >
      <div className="mx-auto w-full max-w-(--container-workspace)">
        <CallConfigHeader
          call={data.call}
          activeFieldsCount={data.activeFieldsCount}
          stagesCount={data.stages.length}
          activeCriteriaCount={data.activeCriteriaCount}
        />

        {errorText ? (
          <p
            className="mt-5 rounded-xl border border-red-800/25 bg-red-50 p-4 text-sm text-red-900"
            role="alert"
          >
            {errorText}
          </p>
        ) : null}

        <CallConfigWizard
          call={data.call}
          fields={data.fields}
          stages={data.stages}
          criteria={data.criteria}
          initialStep={initialStep}
        />
      </div>
    </main>
  );
}
