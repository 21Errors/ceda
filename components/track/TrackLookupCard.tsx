import Link from "next/link";
import { FileSearch, Search } from "lucide-react";

interface TrackLookupCardProps {
  normalizedRef: string;
  hasValidFormat: boolean;
  hasMatch: boolean;
}

export function TrackLookupCard({
  normalizedRef,
  hasValidFormat,
  hasMatch,
}: TrackLookupCardProps) {
  return (
    <section
      aria-labelledby="lookup-heading"
      className="mt-7 rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-7"
    >
      <h2 id="lookup-heading" className="text-base font-bold text-ceda-ink">
        Look up by reference number
      </h2>
      <p className="mt-1 text-xs text-ceda-muted">
        Format:{" "}
        <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-ceda-ink">
          CEDA-2026-XXXXXXXX
        </code>{" "}
        (case-insensitive).
      </p>
      <form
        method="GET"
        action="/track"
        role="search"
        aria-label="Submission reference lookup"
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label
            htmlFor="reference-lookup"
            className="block text-sm font-semibold text-ceda-ink"
          >
            Submission reference number
          </label>
          <div className="relative mt-1.5">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ceda-muted"
            />
            <input
              id="reference-lookup"
              name="ref"
              type="search"
              defaultValue={normalizedRef}
              placeholder="CEDA-2026-A1B2C3D4"
              autoComplete="off"
              spellCheck={false}
              required
              className="ds-input pl-10 font-mono uppercase tracking-wide"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white transition hover:bg-ceda-burgundy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
          >
            <FileSearch aria-hidden="true" className="h-4 w-4" />
            Track status
          </button>
          {normalizedRef && (
            <Link
              href="/track"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-ceda-line bg-white px-4 text-sm font-semibold text-ceda-body transition hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      {normalizedRef && !hasValidFormat && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-[#B42318]/25 bg-(--status-danger-bg) px-4 py-3 text-sm text-(--status-danger-ink)"
        >
          &ldquo;{normalizedRef}&rdquo; does not match a valid CEDA reference
          number. Expected format is{" "}
          <strong className="font-mono">CEDA-YYYY-XXXXXXXX</strong>.
        </p>
      )}

      {normalizedRef && hasValidFormat && !hasMatch && (
        <div
          role="status"
          className="mt-4 rounded-xl border border-ceda-line bg-ceda-cream px-4 py-4 text-sm text-ceda-body"
        >
          <p className="font-semibold text-ceda-ink">
            No accessible submission matched{" "}
            <span className="font-mono text-ceda-burgundy">{normalizedRef}</span>.
          </p>
          <p className="mt-1 text-xs leading-5 text-ceda-muted">
            Double-check the reference number from your confirmation screen and
            make sure you are signed in with the account that submitted it.
          </p>
        </div>
      )}
    </section>
  );
}
