import { BarChart3, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export function AdminOverviewHeader() {
  return (
    <header className="border-b border-ceda-line bg-white">
      <div className="mx-auto flex max-w-(--container-workspace) flex-col gap-ds-4 px-gutter py-ds-6 sm:flex-row sm:items-end sm:justify-between sm:py-ds-8">
        <div className="min-w-0 max-w-2xl">
          <h1 className="text-[clamp(1.625rem,1.25rem+1.2vw,2.125rem)] font-extrabold leading-[1.15] tracking-tight text-ceda-ink">
            Portal administration
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-ceda-muted sm:text-[0.9375rem]">
            Oversee innovation calls, submission pipelines, staff permissions, and public portal content.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-ds-3">
          <ButtonLink
            href="/admin/reports"
            variant="secondary"
            size="md"
            leftIcon={<BarChart3 className="h-4 w-4" />}
          >
            Reports &amp; analytics
          </ButtonLink>
          <ButtonLink
            href="/admin/calls/new"
            variant="primary"
            size="md"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create a call
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
