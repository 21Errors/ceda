"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

type Question = {
  id: string;
  topic: string | null;
  question: string;
  answer: string;
};

export function FaqBrowser({ questions }: { questions: Question[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return normalized
      ? questions.filter((item) =>
          `${item.question} ${item.answer} ${item.topic ?? ""}`
            .toLocaleLowerCase()
            .includes(normalized),
        )
      : questions;
  }, [query, questions]);
  const topics = [...new Set(filtered.map((item) => item.topic || "General"))];

  return (
    <main id="main-content" className="flex-1 bg-white">
      <section className="px-4 pb-12 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <div className="relative mx-auto overflow-hidden rounded-2xl bg-[#5C150D] px-6 py-10 text-white sm:px-10 sm:py-12 lg:min-h-82.5 lg:px-14">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#F4B58A]">
              Help centre
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Frequently asked questions
            </h1>
            <p className="mt-4 max-w-xl leading-7 text-white/75">
              Answers about CEDA, the Innovation Portal and the current
              submission process.
            </p>
            <search className="mt-7 block max-w-xl">
              <label className="flex min-h-14 items-center gap-3 rounded-xl border border-white/25 bg-white/10 px-4 focus-within:ring-2 focus-within:ring-[#F4B58A]">
                <Search
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-white/70"
                />
                <span className="sr-only">
                  Search frequently asked questions
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  type="search"
                  placeholder="Search questions..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/55"
                />
              </label>
            </search>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 -top-12 hidden h-97.5 w-97.5 items-center justify-center sm:flex lg:right-[7%]">
            <div className="absolute h-64 w-64 rounded-full bg-[#E8710A]/20 blur-3xl" />
            <span className="absolute right-28 top-6 rotate-[-5deg] rounded-xl bg-[#E8710A] px-5 py-2 text-4xl font-black text-[#331F17] shadow-xl">
              FAQ
            </span>
            <span className="absolute right-24 top-24 rotate-[4deg] rounded-xl bg-[#F4B58A] px-7 py-2 text-5xl font-black text-[#331F17] shadow-xl">
              ?
            </span>
            <span className="absolute right-16 top-44 -rotate-3 rounded-xl bg-[#E8710A] px-7 py-2 text-5xl font-black text-white shadow-xl">
              ?
            </span>
            <span className="absolute right-28 top-64 rotate-[5deg] rounded-xl bg-white px-7 py-2 text-5xl font-black text-ceda-burgundy shadow-xl">
              ?
            </span>
          </div>
        </div>
      </section>

      <section
        className="px-4 pb-12 sm:px-6 lg:px-8"
        aria-label="Frequently asked questions">
        <div className="mx-auto max-w-250">
          <p className="mb-6 text-sm text-ceda-muted" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "answer" : "answers"}{" "}
            found
          </p>
          {filtered.length ? (
            <div className="space-y-9">
              {topics.map((topic) => (
                <section key={topic} aria-label={topic}>
                  <h2 className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-ceda-orange">
                    {topic}
                  </h2>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(51,31,23,0.04)]">
                    {filtered
                      .filter((item) => (item.topic || "General") === topic)
                      .map((item) => (
                        <details
                          key={item.id}
                          name="ceda-faq"
                          className="group border-b border-slate-200 px-5 last:border-b-0 sm:px-7">
                          <summary className="flex min-h-17 cursor-pointer list-none items-center justify-between gap-5 py-4 text-left font-bold text-ceda-ink outline-none marker:hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ceda-burgundy [&::-webkit-details-marker]:hidden">
                            <span>{item.question}</span>
                            <ChevronDown
                              aria-hidden="true"
                              className="h-5 w-5 shrink-0 text-ceda-burgundy transition-transform group-open:rotate-180"
                            />
                          </summary>
                          <p className="max-w-3xl whitespace-pre-line pb-5 pr-8 text-sm leading-7 text-ceda-muted">
                            {item.answer}
                          </p>
                        </details>
                      ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#F8F9FA] px-6 py-12 text-center">
              <h2 className="text-xl font-bold text-ceda-ink">
                {questions.length
                  ? "No matching questions"
                  : "No published questions yet"}
              </h2>
              <p className="mt-2 text-sm text-ceda-muted">
                {questions.length
                  ? "Try a different search term or clear the search field."
                  : "Please contact CEDA if you need help."}
              </p>
              {questions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-5 min-h-11 rounded-full bg-ceda-burgundy px-5 text-sm font-bold text-white hover:bg-[#5C150D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy">
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <section
        className="bg-[#FFF9F4] px-4 py-12 sm:px-6 lg:px-8"
        aria-labelledby="authority-contacts-heading">
        <div className="mx-auto max-w-250">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-ceda-orange">
            Authority contacts
          </p>
          <h2
            id="authority-contacts-heading"
            className="mt-2 text-2xl font-bold text-ceda-ink">
            Official contacts in Botswana
          </h2>
          <p className="mt-2 text-sm leading-6 text-ceda-muted">
            Use these official channels for agency or registration enquiries.
            Confirm current details on each authority&apos;s website.
          </p>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            <li className="rounded-2xl border border-ceda-line bg-white p-5">
              <h3 className="font-bold text-ceda-ink">CEDA</h3>
              <p className="mt-2 text-sm text-ceda-muted">
                Four Thirty Square, Plot 54350, CBD, Gaborone
              </p>
              <a
                className="mt-3 block min-h-11 py-3 text-sm font-semibold text-ceda-burgundy underline underline-offset-4"
                href="tel:+2673170895">
                +267 317 0895
              </a>
              <a
                className="block text-sm font-semibold text-ceda-burgundy underline underline-offset-4"
                href="mailto:feedback@ceda.co.bw">
                feedback@ceda.co.bw
              </a>
              <a
                className="mt-3 inline-block text-sm text-ceda-muted underline underline-offset-4"
                href="https://www.ceda.co.bw/contact-us"
                target="_blank"
                rel="noreferrer">
                CEDA contact page
              </a>
            </li>
            <li className="rounded-2xl border border-ceda-line bg-white p-5">
              <h3 className="font-bold text-ceda-ink">
                Botswana Digital &amp; Innovation Hub
              </h3>
              <p className="mt-2 text-sm text-ceda-muted">
                Plot 69184, Block 8, Gaborone
              </p>
              <a
                className="mt-3 block min-h-11 py-3 text-sm font-semibold text-ceda-burgundy underline underline-offset-4"
                href="tel:+2673913289">
                +267 391 3289
              </a>
              <a
                className="block text-sm font-semibold text-ceda-burgundy underline underline-offset-4"
                href="mailto:info@bih.co.bw">
                info@bih.co.bw
              </a>
              <a
                className="mt-3 inline-block text-sm text-ceda-muted underline underline-offset-4"
                href="https://www.bih.co.bw/contact-us/"
                target="_blank"
                rel="noreferrer">
                BDIH contact page
              </a>
            </li>
            <li className="rounded-2xl border border-ceda-line bg-white p-5">
              <h3 className="font-bold text-ceda-ink">
                Companies and Intellectual Property Authority
              </h3>
              <p className="mt-2 text-sm text-ceda-muted">
                Plot 54358, Prime Plaza, CBD, Gaborone
              </p>
              <a
                className="mt-3 block min-h-11 py-3 text-sm font-semibold text-ceda-burgundy underline underline-offset-4"
                href="tel:+2673673700">
                +267 367 3700
              </a>
              <a
                className="block text-sm font-semibold text-ceda-burgundy underline underline-offset-4"
                href="mailto:info@cipa.co.bw">
                info@cipa.co.bw
              </a>
              <a
                className="mt-3 inline-block text-sm text-ceda-muted underline underline-offset-4"
                href="https://www.cipa.co.bw/"
                target="_blank"
                rel="noreferrer">
                CIPA website
              </a>
            </li>
          </ul>        
        </div>
      </section>
    </main>
  );
}
