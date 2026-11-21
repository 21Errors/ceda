import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { GlobalSupportActions } from "@/components/GlobalSupportActions";
import { SubmissionStudioHeader } from "@/components/submissions/SubmissionStudioHeader";

export default function SubmissionsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8F9]">
      <SubmissionStudioHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <footer className="border-t border-ceda-line bg-white">
        <div className="mx-auto flex max-w-[var(--container-shell)] flex-wrap items-center justify-between gap-ds-3 px-gutter py-ds-4 text-xs text-ceda-muted">
          <span className="inline-flex items-center gap-ds-2">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-ceda-burgundy" />
            Submissions are encrypted and governed under Botswana’s Data Protection Act 2024.
          </span>
          <div className="flex items-center gap-ds-4">
            <Link href="/guidelines" className="font-semibold hover:text-ceda-burgundy">
              Guidelines
            </Link>
            <Link href="/faq" className="font-semibold hover:text-ceda-burgundy">
              FAQ
            </Link>
            <Link href="/support" className="font-semibold hover:text-ceda-burgundy">
              Help & Support
            </Link>
          </div>
        </div>
      </footer>
      <GlobalSupportActions />
    </div>
  );
}
