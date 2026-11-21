import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main id="main-content" className="flex flex-1 items-center justify-center px-gutter py-ds-10">
      <section className="w-full max-w-xl rounded-panel border border-ceda-line bg-white p-card-lg shadow-elevated">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">Access restricted</p>
        <h1 className="mt-ds-3 text-3xl font-bold text-ceda-ink">You don’t have access to this workspace</h1>
        <p className="mt-ds-4 leading-7 text-ceda-muted">
          If you believe you need this role, contact a portal administrator.
        </p>
        <Link
          href="/dashboard"
          className="mt-ds-6 inline-flex min-h-11 items-center rounded-full bg-ceda-burgundy px-ds-6 text-sm font-bold text-white transition hover:bg-ceda-burgundy-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
        >
          Go to my dashboard
        </Link>
      </section>
    </main>
  );
}
