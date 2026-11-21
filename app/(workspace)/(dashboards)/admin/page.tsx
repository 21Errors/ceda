import Link from "next/link";
import { Suspense } from "react";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { requireRole } from "@/lib/authorization";
import { db } from "@/db";
import { innovationCalls } from "@/db/schema";
import { asc } from "drizzle-orm";

export default function AdminPage() {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="list" />}>
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  await requireRole("admin", "/admin");
  const calls = await db
    .select({
      id: innovationCalls.id,
      title: innovationCalls.title,
      status: innovationCalls.status,
      closesAt: innovationCalls.closesAt,
    })
    .from(innovationCalls)
    .orderBy(asc(innovationCalls.createdAt));

  return (
    <main
      id="main-content"
      className="flex-1 bg-white px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-275">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
              CEDA Innovation Portal
            </p>
            <h1 className="mt-2 text-3xl font-bold text-ceda-ink">
              Portal administration
            </h1>
            <p className="mt-2 text-sm text-ceda-muted">
              Manage innovation calls and their submission forms.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/users"
              className="inline-flex min-h-11 w-fit items-center rounded-full border border-ceda-line bg-white px-5 text-sm font-bold text-ceda-burgundy hover:bg-[#FFF9F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy">
              Manage users and roles
            </Link>
            <Link
              href="/admin/reviews"
              className="inline-flex min-h-11 w-fit items-center rounded-full border border-ceda-line bg-white px-5 text-sm font-bold text-ceda-burgundy hover:bg-[#FFF9F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy">
              Review pipeline
            </Link>
            <Link
              href="/admin/awards"
              className="inline-flex min-h-11 w-fit items-center rounded-full border border-ceda-line bg-white px-5 text-sm font-bold text-ceda-burgundy hover:bg-[#FFF9F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy">
              Grant awards
            </Link>
            <Link
              href="/admin/content/faqs"
              className="inline-flex min-h-11 w-fit items-center rounded-full border border-ceda-line bg-white px-5 text-sm font-bold text-ceda-burgundy hover:bg-[#FFF9F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy">
              Manage FAQs
            </Link>
            <Link
              href="/admin/audit"
              className="inline-flex min-h-11 w-fit items-center rounded-full border border-ceda-line bg-white px-5 text-sm font-bold text-ceda-burgundy hover:bg-[#FFF9F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy">
              View audit trail
            </Link>
            <Link
              href="/admin/reports"
              className="inline-flex min-h-11 w-fit items-center rounded-full border border-ceda-line bg-white px-5 text-sm font-bold text-ceda-burgundy hover:bg-[#FFF9F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy">
              View reports
            </Link>
            <Link
              href="/admin/calls/new"
              className="inline-flex min-h-11 w-fit items-center rounded-full bg-ceda-burgundy px-5 text-sm font-bold text-white hover:bg-[#5C150D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy">
              Create a call
            </Link>
          </div>
        </div>
        <section className="mt-8" aria-labelledby="calls-heading">
          <h2 id="calls-heading" className="text-xl font-bold text-ceda-ink">
            Innovation calls
          </h2>
          {calls.length ? (
            <div className="mt-4 space-y-3">
              {calls.map((call) => (
                <Link
                  key={call.id}
                  href={`/admin/calls/${call.id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-ceda-line bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    <span className="block font-semibold text-ceda-ink">
                      {call.title}
                    </span>
                    <span className="mt-1 block text-sm capitalize text-ceda-muted">
                      {call.status}
                      {call.closesAt
                        ? ` · closes ${call.closesAt.toLocaleDateString("en-BW", { dateStyle: "medium", timeZone: "Africa/Gaborone" })}`
                        : ""}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-ceda-burgundy">
                    Configure call →
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-ceda-line bg-[#FFF9F4] p-6 text-sm text-ceda-body">
              No calls are configured yet.
            </div>
          )}
        </section>
        <section className="mt-9 rounded-2xl bg-[#FFF9F4] p-6">
          <h2 className="font-bold text-ceda-ink">Configuration and reports</h2>
          <p className="mt-2 text-sm leading-6 text-ceda-muted">
            <Link
              href="/admin/categories"
              className="font-semibold text-ceda-burgundy underline underline-offset-4">
              Manage submission categories
            </Link>
            . Portal document management and broader content editing remain to
            be added.
          </p>
        </section>
      </div>
    </main>
  );
}
