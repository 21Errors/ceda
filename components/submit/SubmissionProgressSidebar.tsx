"use client";

import { Check } from "lucide-react";
import { ReadinessChecker } from "@/components/submit/ReadinessChecker";
import type { IdeaReadinessResult } from "@/lib/idea-readiness";
import { SUBMISSION_SECTIONS } from "./submission-config";

export function SubmissionProgressSidebar({
  active,
  onSelectSection,
  readiness,
}: {
  active: number;
  onSelectSection: (index: number) => void;
  readiness: IdeaReadinessResult;
}) {
  return (
    <aside
      className="rounded-3xl border border-ceda-line bg-white p-4 shadow-sm lg:sticky lg:top-24"
      aria-label="Application progress"
    >
      <p className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.14em] text-ceda-muted">
        Sections
      </p>
      <ol className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
        {SUBMISSION_SECTIONS.map((section, index) => (
          <li key={section.key}>
            <button
              type="button"
              onClick={() => onSelectSection(index)}
              aria-current={active === index ? "step" : undefined}
              className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition ${
                active === index
                  ? "bg-[#FFF1E4] font-semibold text-ceda-burgundy"
                  : "text-ceda-muted hover:bg-surface-muted hover:text-ceda-ink"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  active === index
                    ? "bg-ceda-burgundy text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {index < active ? (
                  <Check aria-hidden="true" className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="min-w-0 truncate">{section.label}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-4 border-t border-slate-100 pt-4">
        <label htmlFor="application-progress" className="text-xs font-semibold text-ceda-muted">
          Progress: section {active + 1} of {SUBMISSION_SECTIONS.length}
        </label>
        <progress
          id="application-progress"
          max={SUBMISSION_SECTIONS.length}
          value={active + 1}
          className="mt-2 block h-2 w-full accent-ceda-burgundy"
        >
          {active + 1} of {SUBMISSION_SECTIONS.length}
        </progress>
      </div>
      <ReadinessChecker
        readiness={readiness}
        onJumpToSection={onSelectSection}
        variant="sidebar"
      />
    </aside>
  );
}
