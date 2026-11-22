import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, BookOpen, Download, FileText } from "lucide-react";
import { getAttachmentTypeLabel } from "@/lib/attachments";
import {
  getDocumentDownloadPath,
  resolveGuidelinesBlocks,
} from "@/lib/portal-content";
import {
  getAllContentBlocks,
  getPublishedPortalDocuments,
} from "@/lib/server/portal-content";

export default function GuidelinesPage() {
  return (
    <Suspense
      fallback={
        <main id="main-content" className="flex-1 bg-white px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-5xl animate-pulse space-y-4">
            <div className="h-8 w-64 rounded bg-surface-muted" />
            <div className="h-36 rounded-2xl bg-surface-muted" />
          </div>
        </main>
      }>
      <GuidelinesContent />
    </Suspense>
  );
}

async function GuidelinesContent() {
  const [blocks, publishedDocs] = await Promise.all([
    getAllContentBlocks(),
    getPublishedPortalDocuments(),
  ]);
  const guidelineSections = resolveGuidelinesBlocks(blocks);

  return (
    <main id="main-content" className="flex-1 bg-white">
      <section className="bg-[#5C150D] px-4 py-12 text-white sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#F4B58A]">
            Applicant Handbook
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
            Application Guidelines &amp; Templates
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
            Everything you need to prepare a strong innovation submission,
            understand CEDA&apos;s evaluation stages, and download official
            supporting templates.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/submit"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-ceda-burgundy transition hover:bg-[#FFF1E4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              Start an application
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              href="/faq"
              className="inline-flex min-h-11 items-center rounded-full border border-white/30 px-5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              Browse FAQs
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Guidelines sections */}
        <section
          aria-labelledby="guidelines-sections-heading"
          className="space-y-6">
          <div className="flex items-center gap-2.5">
            <BookOpen
              aria-hidden="true"
              className="h-5 w-5 text-ceda-burgundy"
            />
            <h2
              id="guidelines-sections-heading"
              className="text-2xl font-bold text-ceda-ink">
              Eligibility &amp; submission guidance
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {guidelineSections.map((section, index) => (
              <article
                key={section.key}
                className="rounded-2xl border border-ceda-line bg-[#FFFDFC] p-6 shadow-xs">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-ceda-burgundy">
                  Section 0{index + 1}
                </p>
                <h3 className="mt-2 text-lg font-bold text-ceda-ink">
                  {section.title}
                </h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ceda-body">
                  {section.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Downloadable Document Templates */}
        <section
          aria-labelledby="templates-heading"
          className="mt-12 rounded-2xl border border-ceda-line bg-[#FFF9F4] p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
                Official downloads
              </p>
              <h2
                id="templates-heading"
                className="mt-1 text-2xl font-bold text-ceda-ink">
                Downloadable templates &amp; documents
              </h2>
              <p className="mt-1.5 text-sm text-ceda-muted">
                Use these official templates when preparing your proposal and
                supporting attachments.
              </p>
            </div>
          </div>

          {publishedDocs.length > 0 ? (
            <ul className="mt-6 space-y-3">
              {publishedDocs.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ceda-line bg-white px-5 py-4 shadow-xs">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ceda-cream-mid text-ceda-burgundy">
                      <FileText aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ceda-ink">
                        {doc.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ceda-muted">
                        {getAttachmentTypeLabel(null, doc.fileName)} ·{" "}
                        {doc.fileName}
                        {doc.callTitle ? ` · ${doc.callTitle}` : ""}
                      </p>
                    </div>
                  </div>
                  <a
                    href={getDocumentDownloadPath(doc.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ceda-burgundy px-5 text-xs font-bold text-white transition hover:bg-ceda-burgundy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                    <Download aria-hidden="true" className="h-4 w-4" />
                    Download
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 rounded-xl border border-ceda-line bg-white p-5 text-sm text-ceda-muted">
              No downloadable templates are published at the moment. You can
              submit your proposal directly using the online submission form or
              contact CEDA support for assistance.
            </p>
          )}
        </section>

        {/* Bottom CTA */}
        <section className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ceda-line bg-white p-6">
          <div>
            <h2 className="text-base font-bold text-ceda-ink">
              Need help with your application?
            </h2>
            <p className="mt-1 text-sm text-ceda-muted">
              Reach a CEDA Service Consultant during office hours (09:00–16:00
              CAT, weekdays) or browse verified regulatory contacts.
            </p>
          </div>
          <Link
            href="/support"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ceda-burgundy px-5 text-sm font-bold text-ceda-burgundy hover:bg-[#FFF9F4]">
            Contact support
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
