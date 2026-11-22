import Link from "next/link";
import { Suspense } from "react";
import { FileEdit, Megaphone, RotateCcw, Trash2 } from "lucide-react";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { requireRole } from "@/lib/authorization";
import {
  CORE_CONTENT_SLOTS,
  getContentBlockSection,
  isCoreContentKey,
} from "@/lib/portal-content";
import { getAllContentBlocks } from "@/lib/server/portal-content";
import {
  createAnnouncementBlock,
  deleteContentBlock,
  saveContentBlock,
} from "./actions";

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

  const notice =
    query.notice === "saved"
      ? "Content block saved and public portal pages refreshed."
      : query.notice === "created"
        ? "New announcement or guideline section published."
        : query.notice === "deleted"
          ? "Content block removed and public pages refreshed."
          : "";

  const errorMessage =
    query.error === "notfound"
      ? "That content block no longer exists. Reload the page."
      : query.error
        ? "Check the title and body fields (body is required, up to 10,000 characters)."
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
          <div className="flex items-center gap-4 text-sm font-semibold text-ceda-burgundy">
            <Link
              href="/guidelines"
              className="underline underline-offset-4">
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

        {/* Create new announcement or extra guideline section */}
        <section
          aria-labelledby="create-block-heading"
          className="mt-7 rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-7">
          <h2
            id="create-block-heading"
            className="flex items-center gap-2 text-xl font-bold text-ceda-ink">
            <Megaphone
              aria-hidden="true"
              className="h-5 w-5 text-ceda-burgundy"
            />
            Publish a news announcement or guideline section
          </h2>
          <form
            action={createAnnouncementBlock}
            className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="new-block-section"
                  className="block text-sm font-semibold text-ceda-ink">
                  Target public page
                </label>
                <select
                  id="new-block-section"
                  name="section"
                  defaultValue="news"
                  className="ds-input mt-1.5">
                  <option value="news">News &amp; Announcements (/news)</option>
                  <option value="guidelines">
                    Application Guidelines (/guidelines)
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="new-block-title"
                  className="block text-sm font-semibold text-ceda-ink">
                  Heading / title
                </label>
                <input
                  id="new-block-title"
                  name="title"
                  type="text"
                  required
                  maxLength={255}
                  placeholder="e.g. Submission deadline extended to 30 November"
                  className="ds-input mt-1.5"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="new-block-body"
                className="block text-sm font-semibold text-ceda-ink">
                Content body
              </label>
              <textarea
                id="new-block-body"
                name="body"
                required
                rows={4}
                maxLength={10000}
                placeholder="Write clear plain-text details for portal visitors..."
                className="ds-input mt-1.5 min-h-28 py-3"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <label className="inline-flex items-center gap-2.5 text-sm text-ceda-ink">
                <input
                  type="checkbox"
                  name="isPublished"
                  value="true"
                  defaultChecked
                  className="h-4 w-4 accent-ceda-burgundy"
                />
                <span>Publish immediately</span>
              </label>

              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white hover:bg-[#5C150D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                Publish content
              </button>
            </div>
          </form>
        </section>

        {/* Core editable slots (Guidelines + News banner) */}
        <section
          aria-labelledby="core-slots-heading"
          className="mt-9 space-y-4">
          <div>
            <h2
              id="core-slots-heading"
              className="flex items-center gap-2 text-lg font-bold text-ceda-ink">
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

          {CORE_CONTENT_SLOTS.map((slot) => {
            const saved = byKey.get(slot.key);
            const currentTitle = saved?.title ?? slot.defaultTitle;
            const currentBody = saved?.body ?? slot.defaultBody;
            const isPublished = saved ? saved.isPublished : slot.section === "guidelines";

            return (
              <article
                key={slot.key}
                className="rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-ceda-burgundy">
                      {slot.key}
                    </p>
                    <h3 className="mt-1 text-base font-bold text-ceda-ink">
                      {slot.label}
                    </h3>
                    <p className="mt-0.5 text-xs text-ceda-muted">
                      {slot.description}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      saved
                        ? saved.isPublished
                          ? "bg-emerald-50 text-emerald-900"
                          : "bg-surface-muted text-ceda-muted"
                        : "bg-ceda-cream-mid text-ceda-burgundy"
                    }`}>
                    {saved
                      ? saved.isPublished
                        ? "Customized · Published"
                        : "Customized · Hidden"
                      : slot.section === "guidelines"
                        ? "Using default copy"
                        : "Not active"}
                  </span>
                </div>

                <form action={saveContentBlock} className="mt-4 space-y-3">
                  <input type="hidden" name="key" value={slot.key} />
                  <div>
                    <label
                      htmlFor={`title-${slot.key}`}
                      className="block text-xs font-semibold text-ceda-ink">
                      Section heading
                    </label>
                    <input
                      id={`title-${slot.key}`}
                      name="title"
                      type="text"
                      maxLength={255}
                      defaultValue={currentTitle}
                      className="ds-input mt-1"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`body-${slot.key}`}
                      className="block text-xs font-semibold text-ceda-ink">
                      Section body
                    </label>
                    <textarea
                      id={`body-${slot.key}`}
                      name="body"
                      required
                      rows={4}
                      maxLength={10000}
                      defaultValue={currentBody}
                      className="ds-input mt-1 min-h-28 py-3"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <label className="inline-flex items-center gap-2 text-sm text-ceda-ink">
                      <input
                        type="checkbox"
                        name="isPublished"
                        value="true"
                        defaultChecked={isPublished}
                        className="h-4 w-4 accent-ceda-burgundy"
                      />
                      <span>Show on public page</span>
                    </label>
                    <button
                      type="submit"
                      className="inline-flex min-h-10 items-center rounded-full bg-ceda-burgundy px-5 text-xs font-bold text-white hover:bg-[#5C150D]">
                      Save section
                    </button>
                  </div>
                </form>

                {saved && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ceda-line pt-3">
                    <p className="text-xs text-ceda-muted">
                      Last updated{" "}
                      {saved.updatedAt.toLocaleDateString("en-BW", {
                        dateStyle: "medium",
                        timeZone: "Africa/Gaborone",
                      })}
                      {saved.updatedByName ? ` by ${saved.updatedByName}` : ""}
                    </p>
                    <form action={deleteContentBlock}>
                      <input type="hidden" name="blockId" value={saved.id} />
                      <button
                        type="submit"
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-ceda-line px-3.5 text-xs font-semibold text-ceda-body hover:bg-surface-muted">
                        <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                        Reset to default
                      </button>
                    </form>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        {/* Custom announcements & extra guideline sections */}
        {customBlocks.length > 0 && (
          <section
            aria-labelledby="custom-blocks-heading"
            className="mt-9 space-y-4">
            <h2
              id="custom-blocks-heading"
              className="text-lg font-bold text-ceda-ink">
              Published announcements &amp; custom sections ({customBlocks.length})
            </h2>
            {customBlocks.map((block) => {
              const section = getContentBlockSection(block.key);
              return (
                <article
                  key={block.id}
                  className="rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-ceda-burgundy">
                      {block.key} · {section}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        block.isPublished
                          ? "bg-emerald-50 text-emerald-900"
                          : "bg-surface-muted text-ceda-muted"
                      }`}>
                      {block.isPublished ? "Published" : "Hidden"}
                    </span>
                  </div>

                  <form action={saveContentBlock} className="mt-3 space-y-3">
                    <input type="hidden" name="key" value={block.key} />
                    <div>
                      <label
                        htmlFor={`custom-title-${block.id}`}
                        className="block text-xs font-semibold text-ceda-ink">
                        Heading
                      </label>
                      <input
                        id={`custom-title-${block.id}`}
                        name="title"
                        type="text"
                        maxLength={255}
                        defaultValue={block.title ?? ""}
                        className="ds-input mt-1"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`custom-body-${block.id}`}
                        className="block text-xs font-semibold text-ceda-ink">
                        Body
                      </label>
                      <textarea
                        id={`custom-body-${block.id}`}
                        name="body"
                        required
                        rows={4}
                        maxLength={10000}
                        defaultValue={block.body}
                        className="ds-input mt-1 min-h-24 py-3"
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-sm text-ceda-ink">
                        <input
                          type="checkbox"
                          name="isPublished"
                          value="true"
                          defaultChecked={block.isPublished}
                          className="h-4 w-4 accent-ceda-burgundy"
                        />
                        <span>Published</span>
                      </label>
                      <button
                        type="submit"
                        className="inline-flex min-h-10 items-center rounded-full bg-ceda-burgundy px-5 text-xs font-bold text-white hover:bg-[#5C150D]">
                        Save changes
                      </button>
                    </div>
                  </form>

                  <form
                    action={deleteContentBlock}
                    className="mt-3 border-t border-ceda-line pt-3">
                    <input type="hidden" name="blockId" value={block.id} />
                    <button
                      type="submit"
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-red-800/30 px-4 text-xs font-semibold text-red-900 hover:bg-red-50">
                      <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                      Delete section
                    </button>
                  </form>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
