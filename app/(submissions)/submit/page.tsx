import { Suspense } from "react";
import { PageStub } from "@/components/PageStub";
import Link from "next/link";
import { SubmissionForm } from "@/components/submit/SubmissionForm";
import { requireRole } from "@/lib/authorization";
import { getVersionAttachments } from "@/lib/server/attachments";
import { loadUserProfileDetails } from "@/lib/server/account";
import { getOpenSubmissionOptions, getSubmitterDraft } from "@/lib/server/idea-submission";

export default function SubmitPage({ searchParams }: PageProps<"/submit">) {
  return <Suspense fallback={<PageStub title="Innovation submission" description="Loading available opportunities..." />}><SubmitContent searchParams={searchParams} /></Suspense>;
}

async function SubmitContent({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const user = await requireRole("submitter", "/submit");
  const query = await searchParams;
  const rawDraftId = query.draft;
  const draftId = Array.isArray(rawDraftId) ? rawDraftId[0] : rawDraftId;
  const draft = draftId ? await getSubmitterDraft(draftId, user.id) : null;
  const [options, initialAttachments, profile] = await Promise.all([
    draftId && !draft ? Promise.resolve(null) : getOpenSubmissionOptions(draft?.callId),
    draft?.currentVersionId ? getVersionAttachments(draft.currentVersionId) : Promise.resolve([]),
    loadUserProfileDetails(user.id),
  ]);

  return <main id="main-content" className="flex-1 bg-[#F7F8F9] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">CEDA Innovation Portal</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ceda-ink sm:text-4xl">Innovation submission</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ceda-muted">Tell us about your solution, its progress, and the difference it can make. Save your application and return to it later.</p>
      <section className="mt-5 max-w-2xl rounded-xl border border-ceda-line bg-white px-4 py-3 text-sm text-ceda-body" aria-label="Applicant profile details">
        <p><span className="font-semibold text-ceda-ink">Applicant:</span> {user.name}</p>
        {(profile?.jobTitle || profile?.organisation) && <p className="mt-1 text-xs text-ceda-muted">{[profile.jobTitle, profile.organisation].filter(Boolean).join(" · ")}</p>}
        <Link href="/profile" className="mt-2 inline-flex min-h-10 items-center font-semibold text-ceda-burgundy underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">Update profile details</Link>
      </section>
      <div className="mt-8">
        {options ? <SubmissionForm
          call={{ ...options.call, closesAt: options.call.closesAt?.toISOString() ?? null }}
          fields={options.fields}
          categories={options.categories}
          initialDraft={draft ? { id: draft.id, categoryId: draft.categoryId, title: draft.title, summary: draft.summary, answers: draft.answers ?? {}, termsAccepted: Boolean(draft.termsAcceptedAt) } : null}
          initialAttachments={initialAttachments}
        /> : <div className="rounded-2xl border border-ceda-line bg-white p-6 text-sm leading-6 text-ceda-body shadow-sm" role="status">
          {draftId && !draft ? "This saved application could not be found. Return to your dashboard and open one of your drafts." : draft ? "This opportunity is no longer available for editing or submission. Contact CEDA for help with your saved application." : "No innovation opportunities are accepting submissions right now. Please check again later or contact CEDA for help."}
        </div>}
      </div>
    </div>
  </main>;
}
