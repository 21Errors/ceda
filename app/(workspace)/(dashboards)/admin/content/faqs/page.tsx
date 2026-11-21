import Link from "next/link";
import { Suspense } from "react";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { faqs } from "@/db/schema";
import { CreateFaqForm, EditFaqForm } from "@/components/admin/FaqAdminForms";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { requireRole } from "@/lib/authorization";
import { deleteFaq } from "@/app/(workspace)/(dashboards)/admin/content/faqs/actions";

export default function AdminFaqPage({
  searchParams,
}: PageProps<"/admin/content/faqs">) {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="list" />}>
      <FaqAdminContent searchParams={searchParams} />
    </Suspense>
  );
}

async function FaqAdminContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole("admin", "/admin/content/faqs");
  const [items, query] = await Promise.all([
    db
      .select()
      .from(faqs)
      .orderBy(asc(faqs.topic), asc(faqs.position), asc(faqs.question)),
    searchParams,
  ]);
  const notice =
    query.notice === "saved"
      ? "FAQ saved and the public page refreshed."
      : query.notice === "deleted"
        ? "FAQ removed from the public page."
        : query.error === "notfound"
          ? "That FAQ no longer exists. Reload the page."
          : query.error
            ? "Check the question, answer, topic and order fields."
            : "";

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#FFFDFC] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-250">
        <Link
          href="/admin"
          className="text-sm font-semibold text-ceda-burgundy underline underline-offset-4">
          ← Back to administration
        </Link>
        <header className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
            Portal content
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ceda-ink">Manage FAQs</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ceda-muted">
            Published questions appear on the public FAQ page. Answers are
            rendered as plain text, so links should be entered as full URLs.
          </p>
        </header>
        {notice && (
          <p
            className="mt-5 rounded-xl border border-ceda-line bg-white p-4 text-sm text-ceda-body"
            role="status">
            {notice}
          </p>
        )}
        <section
          className="mt-7 rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-7"
          aria-labelledby="create-faq-heading">
          <h2
            id="create-faq-heading"
            className="text-xl font-bold text-ceda-ink">
            Add a question
          </h2>
          <CreateFaqForm />
        </section>
        <section className="mt-9 space-y-4" aria-label="Existing FAQs">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-6">
              <EditFaqForm
                faqId={item.id}
                question={item.question}
                topic={item.topic ?? ""}
                answer={item.answer}
                position={item.position}
                isPublished={item.isPublished}
              />
              <form
                action={deleteFaq}
                aria-label={`Delete FAQ: ${item.question}`}
                className="mt-3">
                <input type="hidden" name="faqId" value={item.id} />
                <button
                  type="submit"
                  className="min-h-11 rounded-full border border-red-800/30 px-4 text-sm font-semibold text-red-900 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800">
                  Delete question
                </button>
              </form>
              <p className="mt-2 text-xs text-ceda-muted">
                {item.isPublished
                  ? "Visible publicly"
                  : "Hidden from the public page"}
              </p>
            </article>
          ))}
        </section>
        {!items.length && (
          <p className="mt-5 rounded-xl bg-white p-5 text-sm text-ceda-muted">
            No questions have been created yet.
          </p>
        )}
      </div>
    </main>
  );
}
