import Link from "next/link";
import { CircleCheck } from "lucide-react";

export function SubmissionSuccessCard({ referenceNo }: { referenceNo: string }) {
  return (
    <section
      className="rounded-3xl border border-green-800/20 bg-white p-8 shadow-sm sm:p-12"
      aria-live="polite"
    >
      <CircleCheck aria-hidden="true" className="h-12 w-12 text-green-700" />
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-green-800">
        Application received
      </p>
      <h2 className="mt-2 text-2xl font-bold text-ceda-ink">
        Your reference is {referenceNo}
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ceda-muted">
        Your innovation submission is now in the review process. You can follow updates from your dashboard.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex min-h-12 items-center rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white hover:bg-[#5C150D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy"
      >
        Open my dashboard
      </Link>
    </section>
  );
}
