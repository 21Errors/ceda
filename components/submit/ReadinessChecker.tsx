"use client";

import { AlertCircle, ArrowUpRight, CheckCircle2, Sparkles, TriangleAlert } from "lucide-react";
import type { IdeaReadinessResult } from "@/lib/idea-readiness";

interface ReadinessCheckerProps {
  readiness: IdeaReadinessResult;
  onJumpToSection: (sectionIndex: number) => void;
  variant?: "sidebar" | "full";
}

function getGradeBadgeClass(grade: IdeaReadinessResult["grade"]): string {
  switch (grade) {
    case "Ready to submit":
      return "border-emerald-700/25 bg-emerald-50 text-emerald-900";
    case "Strong draft":
      return "border-ceda-burgundy/25 bg-ceda-cream-mid text-ceda-burgundy";
    case "Needs detail":
      return "border-amber-600/30 bg-amber-50 text-amber-950";
    default:
      return "border-slate-200 bg-surface-muted text-ceda-muted";
  }
}

export function ReadinessChecker({
  readiness,
  onJumpToSection,
  variant = "sidebar",
}: ReadinessCheckerProps) {
  const barColor =
    readiness.score >= 85
      ? "bg-emerald-600"
      : readiness.score >= 65
        ? "bg-ceda-burgundy"
        : readiness.score >= 40
          ? "bg-ceda-orange"
          : "bg-slate-400";

  if (variant === "sidebar") {
    return (
      <div
        className="mt-4 border-t border-slate-100 pt-4"
        aria-label="Submission readiness check">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-ceda-burgundy">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
            Readiness check
          </p>
          <span className="text-sm font-black text-ceda-ink">
            {readiness.score}/100
          </span>
        </div>

        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={readiness.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Submission readiness score">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${readiness.score}%` }}
          />
        </div>

        <p
          className={`mt-2.5 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getGradeBadgeClass(readiness.grade)}`}>
          {readiness.grade}
        </p>

        {readiness.topActionItems.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {readiness.topActionItems.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => onJumpToSection(item.targetSectionIndex)}
                  className="group flex w-full items-start justify-between gap-2 rounded-xl border border-ceda-line bg-[#FFFDFC] p-2.5 text-left text-xs transition hover:border-ceda-burgundy/40 hover:bg-[#FFF9F4]">
                  <span className="min-w-0">
                    <span className="block font-semibold text-ceda-ink group-hover:text-ceda-burgundy">
                      {item.label}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[11px] leading-4 text-ceda-muted">
                      {item.guidance}
                    </span>
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ceda-burgundy"
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-emerald-800">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
            All readiness criteria look strong!
          </p>
        )}
      </div>
    );
  }

  return (
    <section
      aria-labelledby="pre-submit-readiness-heading"
      className="rounded-2xl border border-ceda-line bg-[#FFF9F4] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-ceda-burgundy">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            Pre-submission readiness check
          </p>
          <h3
            id="pre-submit-readiness-heading"
            className="mt-1 text-lg font-bold text-ceda-ink">
            Readiness score: {readiness.score} / 100
          </h3>
        </div>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getGradeBadgeClass(readiness.grade)}`}>
          {readiness.grade}
        </span>
      </div>

      <div
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white"
        role="progressbar"
        aria-valuenow={readiness.score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Pre-submission readiness score">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${readiness.score}%` }}
        />
      </div>

      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {readiness.checks.map((check) => {
          const Icon =
            check.status === "pass"
              ? CheckCircle2
              : check.status === "warn"
                ? TriangleAlert
                : AlertCircle;
          const iconTone =
            check.status === "pass"
              ? "text-emerald-700"
              : check.status === "warn"
                ? "text-amber-700"
                : "text-red-700";

          return (
            <li
              key={check.id}
              className="flex flex-col justify-between rounded-xl border border-ceda-line bg-white p-3.5">
              <div className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-2 text-xs font-bold text-ceda-ink">
                  <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${iconTone}`} />
                  {check.label}
                </span>
                <span className="shrink-0 text-[11px] font-bold text-ceda-muted">
                  {check.points}/{check.maxPoints}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-ceda-muted">
                {check.guidance}
              </p>
              {check.status !== "pass" && (
                <button
                  type="button"
                  onClick={() => onJumpToSection(check.targetSectionIndex)}
                  className="mt-2 inline-flex items-center gap-1 self-start text-xs font-semibold text-ceda-burgundy hover:underline">
                  Improve this section
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
