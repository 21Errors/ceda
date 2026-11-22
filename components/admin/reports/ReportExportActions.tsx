"use client";

import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";

export function ReportExportActions() {
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <a
        href="/api/admin/reports/export?format=csv"
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ceda-line bg-white px-4 text-xs font-bold text-ceda-burgundy transition hover:bg-[#FFF9F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
      >
        <FileSpreadsheet aria-hidden="true" className="h-4 w-4" />
        Export CSV
      </a>
      <a
        href="/api/admin/reports/export?format=pdf"
        className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ceda-burgundy px-4 text-xs font-bold text-white transition hover:bg-[#5C150D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
      >
        <FileText aria-hidden="true" className="h-4 w-4" />
        Download PDF
        <Download aria-hidden="true" className="h-3.5 w-3.5" />
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ceda-line bg-white px-4 text-xs font-semibold text-ceda-ink transition hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
      >
        <Printer aria-hidden="true" className="h-4 w-4" />
        Print visual report
      </button>
    </div>
  );
}
