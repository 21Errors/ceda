import Link from "next/link";

export function PortalCtaSection() {
  return (
    <section
      aria-labelledby="portal-cta-heading"
      className="bg-white px-gutter py-12 lg:py-16"
    >
      <div className="mx-auto flex max-w-[var(--container-shell)] flex-col gap-6 rounded-2xl border border-ceda-line bg-[#FFF8F2] px-6 py-8 sm:px-10 sm:py-10 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        <div className="max-w-2xl">
          <h2
            id="portal-cta-heading"
            className="text-2xl font-bold leading-tight tracking-tight text-ceda-ink sm:text-3xl"
          >
            Bring a citizen enterprise idea from concept to funded reality.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ceda-body sm:text-base">
            Submit your proposal through the official CEDA digital gateway, follow each evaluation milestone, and receive structured feedback from agency reviewers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-ceda-burgundy px-6 text-sm font-semibold text-white transition hover:bg-ceda-burgundy-dark focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ceda-orange"
          >
            Submit an idea
          </Link>
          <Link
            href="/track"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-ceda-burgundy/30 bg-white px-5 text-sm font-semibold text-ceda-burgundy transition hover:border-ceda-burgundy hover:bg-ceda-cream focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ceda-orange"
          >
            Track a submission
          </Link>
        </div>
      </div>
    </section>
  );
}
