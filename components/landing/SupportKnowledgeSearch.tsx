"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { BookOpen, Search } from "lucide-react";

type Result = { title: string; body: string; href: string; source: string };

export function SupportKnowledgeSearch({ onHandoff }: { onHandoff?: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length < 3 || busy) return;
    setBusy(true);
    const response = await fetch(`/api/chat?knowledge=${encodeURIComponent(query.trim())}`, { cache: "no-store" }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setResults(response?.ok && Array.isArray(data?.results) ? data.results : []);
    setBusy(false);
  }

  return (
    <section className="w-full max-w-sm rounded-2xl border border-[#7A1F14]/15 bg-white p-4 text-left shadow-sm" aria-labelledby="help-search-title">
      <h4 id="help-search-title" className="flex items-center gap-2 font-bold text-ceda-ink"><BookOpen aria-hidden="true" className="h-4 w-4 text-ceda-burgundy" /> Find an answer first</h4>
      <form onSubmit={search} className="mt-3 flex gap-2">
        <label htmlFor="support-question" className="sr-only">Search FAQs and application guidelines</label>
        <input id="support-question" type="search" value={query} onChange={(event) => setQuery(event.target.value)} minLength={3} maxLength={240} required placeholder="Ask about guidelines, eligibility…" className="min-h-11 min-w-0 flex-1 rounded-full border border-ceda-line px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy" />
        <button type="submit" disabled={busy} aria-label="Search answers" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-ceda-burgundy text-white disabled:opacity-60"><Search aria-hidden="true" className="h-4 w-4" /></button>
      </form>
      <div className="mt-3 space-y-3" aria-live="polite" aria-busy={busy}>
        {results?.length ? results.map((result) => (
          <article key={`${result.source}:${result.title}`} className="border-t border-ceda-line pt-3 text-xs leading-5">
            <p className="font-semibold text-ceda-ink">{result.title}</p>
            <p className="mt-1 whitespace-pre-line text-ceda-body">{result.body}</p>
            <Link href={result.href} className="mt-1 inline-flex min-h-9 items-center font-semibold text-ceda-burgundy underline underline-offset-2">Read {result.source.toLowerCase()}</Link>
          </article>
        )) : null}
        {results && results.length === 0 && <p className="text-xs text-ceda-muted">No close match found. A consultant can help with your question.</p>}
      </div>
      {onHandoff ? <button type="button" onClick={onHandoff} className="mt-3 min-h-11 w-full rounded-full border border-ceda-burgundy px-4 text-sm font-semibold text-ceda-burgundy">Ask a consultant</button> : null}
    </section>
  );
}
