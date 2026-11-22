import Link from "next/link";
import { requireRole } from "@/lib/authorization";
import { submitFaqSuggestion } from "@/app/(workspace)/(dashboards)/consultant/knowledge-actions";

export default async function ConsultantKnowledgePage({ searchParams }: PageProps<"/consultant/knowledge">) {
  await requireRole("consultant", "/consultant/knowledge");
  const query = await searchParams;
  const notice = Array.isArray(query.notice) ? query.notice[0] : query.notice;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;
  return <main id="main-content" className="flex-1 bg-white px-gutter py-ds-6 sm:py-ds-8">
    <div className="mx-auto w-full max-w-(--container-workspace)">
      <Link href="/consultant" className="text-sm font-semibold text-ceda-burgundy underline">Back to chat queue</Link>
      <h1 className="mt-4 text-3xl font-bold text-ceda-ink">Suggest a common answer</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ceda-muted">Suggest a question and answer that could help applicants. An administrator reviews it before it appears in the public FAQ and chat answer search.</p>
      {notice === "submitted" && <p role="status" className="mt-5 rounded-xl border border-green-700/20 bg-green-50 p-4 text-sm text-green-900">Suggestion sent for administrator review.</p>}
      {error === "invalid" && <p role="alert" className="mt-5 rounded-xl border border-red-700/20 bg-red-50 p-4 text-sm text-red-900">Enter a question (5–500 characters) and answer (5–5,000 characters).</p>}
      <form action={submitFaqSuggestion} className="mt-7 max-w-2xl space-y-5 rounded-2xl border border-ceda-line bg-[#FFFDFC] p-5 sm:p-7">
        <div><label htmlFor="suggestion-question" className="text-sm font-semibold text-ceda-ink">Common question</label><input id="suggestion-question" name="question" required minLength={5} maxLength={500} className="ds-field-control mt-2 min-h-12 w-full rounded-xl border border-ceda-line bg-white px-4 text-base" /></div>
        <div><label htmlFor="suggestion-answer" className="text-sm font-semibold text-ceda-ink">Suggested answer</label><textarea id="suggestion-answer" name="answer" required minLength={5} maxLength={5000} rows={6} className="ds-field-control mt-2 w-full rounded-xl border border-ceda-line bg-white px-4 py-3 text-base" /></div>
        <button type="submit" className="min-h-11 rounded-full bg-ceda-burgundy px-5 text-sm font-bold text-white">Send for review</button>
      </form>
    </div>
  </main>;
}
