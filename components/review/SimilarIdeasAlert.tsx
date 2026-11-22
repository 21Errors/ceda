import { AlertTriangle, CheckCircle2, CopyCheck } from "lucide-react";
import type { SimilarIdeaMatch } from "@/lib/idea-similarity";

interface SimilarIdeasAlertProps {
  matches: readonly SimilarIdeaMatch[];
  compact?: boolean;
}

export function SimilarIdeasAlert({
  matches,
  compact = false,
}: SimilarIdeasAlertProps) {
  if (!matches.length) {
    return (
      <div
        role="status"
        className={`flex items-center gap-2.5 rounded-xl border border-emerald-700/20 bg-emerald-50 text-emerald-950 ${
          compact ? "px-3.5 py-2.5 text-xs" : "p-4 text-sm"
        }`}>
        <CheckCircle2
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-emerald-700"
        />
        <span>
          <strong>Automated overlap check:</strong> No duplicate or highly
          similar submissions detected in the portal corpus.
        </span>
      </div>
    );
  }

  const hasHigh = matches.some((match) => match.severity === "high");

  return (
    <section
      aria-label="Automated duplicate and similar idea detection"
      className={`rounded-2xl border ${
        hasHigh
          ? "border-red-800/30 bg-red-50/90"
          : "border-amber-600/30 bg-amber-50/90"
      } ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            hasHigh
              ? "bg-red-100 text-red-900"
              : "bg-amber-100 text-amber-900"
          }`}>
          {hasHigh ? (
            <AlertTriangle aria-hidden="true" className="h-4 w-4" />
          ) : (
            <CopyCheck aria-hidden="true" className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-bold uppercase tracking-[0.14em] ${
              hasHigh ? "text-red-900" : "text-amber-950"
            }`}>
            {hasHigh
              ? "Potential duplicate detected"
              : "Similar submissions flagged"}
          </p>
          <p
            className={`mt-1 text-xs leading-5 ${
              hasHigh ? "text-red-900/85" : "text-amber-950/85"
            }`}>
            Automated TF-IDF text similarity identified {matches.length}{" "}
            overlapping{" "}
            {matches.length === 1 ? "proposal" : "proposals"} for reviewer
            awareness. Compare scope and originality before scoring or deciding.
          </p>

          <ul className="mt-3 space-y-2.5">
            {matches.map((match) => (
              <li
                key={match.ideaId}
                className="rounded-xl border border-ceda-line bg-white p-3.5 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-ceda-burgundy">
                      {match.referenceNo}
                    </span>
                    <span className="ml-2 text-xs text-ceda-muted">
                      {match.sameCall ? "Same call" : match.callTitle} ·{" "}
                      <span className="capitalize">
                        {match.status.replaceAll("_", " ")}
                      </span>
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      match.severity === "high"
                        ? "bg-red-100 text-red-900"
                        : "bg-amber-100 text-amber-950"
                    }`}>
                    {match.similarityPercent}% match
                  </span>
                </div>
                <p className="mt-1 text-sm font-bold text-ceda-ink">
                  {match.title}
                </p>
                {match.matchedTerms.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-ceda-muted">
                      Shared terms:
                    </span>
                    {match.matchedTerms.map((term) => (
                      <span
                        key={term}
                        className="rounded-full bg-[#FFF1E4] px-2 py-0.5 text-[11px] font-medium text-ceda-burgundy">
                        {term}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
