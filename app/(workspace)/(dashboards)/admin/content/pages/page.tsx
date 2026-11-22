import Link from "next/link";
import { Suspense } from "react";
import { FileEdit } from "lucide-react";
import { CoreContentSlotCard } from "@/components/admin/content/CoreContentSlotCard";
import { CreateContentBlockSection } from "@/components/admin/content/CreateContentBlockSection";
import { CustomContentBlockCard } from "@/components/admin/content/CustomContentBlockCard";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { resolvePagesCmsFeedback } from "@/lib/admin-messages";
import { requireRole } from "@/lib/authorization";
import { CORE_CONTENT_SLOTS, isCoreContentKey } from "@/lib/portal-content";
import { getAllContentBlocks } from "@/lib/server/portal-content";

export default function AdminPortalPagesCms({
  searchParams,
}: PageProps<"/admin/content/pages">) {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="list" />}>
      <AdminPortalPagesContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminPortalPagesContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole("admin", "/admin/content/pages");
  const [dbBlocks, query] = await Promise.all([
    getAllContentBlocks(),
    searchParams,
  ]);

  const byKey = new Map(dbBlocks.map((block) => [block.key, block]));
  const customBlocks = dbBlocks.filter((block) => !isCoreContentKey(block.key));
  const { notice, errorMessage } = resolvePagesCmsFeedback(query);

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#FFFDFC] px-gutter py-ds-6 sm:py-ds-8"
    >
      <div className="mx-auto w-full max-w-(--container-workspace)">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-sm font-semibold text-ceda-burgundy">
            <Link href="/guidelines" className="underline underline-offset-4">
              View Guidelines →
            </Link>
            <Link href="/news" className="underline underline-offset-4">
              View News →
            </Link>
          </div>
        </div>

        <header className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
            Portal content
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ceda-ink">
            Public pages &amp; announcements
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ceda-muted">
            Edit Application Guidelines sections and publish portal news or
            announcements. All changes are audited and update the public pages
            immediately.
          </p>
        </header>

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

        <CreateContentBlockSection />

        <section
          aria-labelledby="core-slots-heading"
          className="mt-9 space-y-4"
        >
          <div>
            <h2
              id="core-slots-heading"
              className="flex items-center gap-2 text-lg font-bold text-ceda-ink"
            >
              <FileEdit
                aria-hidden="true"
                className="h-5 w-5 text-ceda-burgundy"
              />
              Core portal page sections
            </h2>
            <p className="mt-1 text-xs text-ceda-muted">
              These sections power `/guidelines` and the featured notice on
              `/news`. Uncustomized slots render built-in default copy.
            </p>
          </div>

          {CORE_CONTENT_SLOTS.map((slot) => (
            <CoreContentSlotCard
              key={slot.key}
              slot={slot}
              saved={byKey.get(slot.key)}
            />
          ))}
        </section>

        {customBlocks.length > 0 ? (
          <section
            aria-labelledby="custom-blocks-heading"
            className="mt-9 space-y-4"
          >
            <h2
              id="custom-blocks-heading"
              className="text-lg font-bold text-ceda-ink"
            >
              Published announcements &amp; custom sections (
              {customBlocks.length})
            </h2>
            {customBlocks.map((block) => (
              <CustomContentBlockCard key={block.id} block={block} />
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
