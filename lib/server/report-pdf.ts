import "server-only";

import { formatDurationSeconds } from "@/lib/chat-analytics-calc";
import {
  formatTurnaroundHours,
  type ExecutiveReportData,
} from "@/lib/reports-analytics";

/**
 * Escapes text for standard PDF literal strings using printable ASCII so the
 * generated PDF renders reliably across all viewers without embedded font binaries.
 */
function sanitizePdfText(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("—", "-")
    .replaceAll("–", "-")
    .replaceAll("·", "|")
    .replace(/[^\x20-\x7e]/g, " ")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
    .trim();
}

interface PdfLine {
  text: string;
  size: number;
  bold?: boolean;
  accent?: boolean;
  spacingAfter?: number;
}

/**
 * Generates a lightweight, standards-compliant PDF 1.4 binary document using
 * built-in Type1 Helvetica fonts (zero external dependencies).
 */
export function buildExecutiveReportPdf(report: ExecutiveReportData): Uint8Array {
  const lines: PdfLine[] = [
    {
      text: "CEDA INNOVATION MANAGEMENT PORTAL",
      size: 10,
      bold: true,
      accent: true,
      spacingAfter: 4,
    },
    {
      text: "Executive Reporting & Analytics Summary",
      size: 18,
      bold: true,
      spacingAfter: 6,
    },
    {
      text: `Generated: ${new Date(report.generatedAt).toLocaleString("en-BW", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Gaborone",
      })} CAT`,
      size: 9,
      spacingAfter: 14,
    },
    { text: "1. Submission Pipeline Overview", size: 12, bold: true, accent: true, spacingAfter: 6 },
    {
      text: `Total submissions: ${report.totals.allSubmissions} (Submitted: ${report.totals.submittedOrBeyond}, Drafts: ${report.totals.drafts})`,
      size: 10,
      spacingAfter: 4,
    },
    {
      text: `In review: ${report.totals.inReview} | Changes requested: ${report.totals.changesRequested} | Approved: ${report.totals.approved} | Awarded: ${report.totals.awarded} | Not selected: ${report.totals.rejected}`,
      size: 10,
      spacingAfter: 12,
    },
    { text: "2. Stage Conversion Funnel", size: 12, bold: true, accent: true, spacingAfter: 6 },
    ...report.stageFunnel.map((step) => ({
      text: `${step.label}: ${step.count} ideas | Step conversion: ${
        step.conversionFromPreviousPercent !== null
          ? `${step.conversionFromPreviousPercent}%`
          : "-"
      } | Overall yield: ${
        step.conversionFromStartPercent !== null
          ? `${step.conversionFromStartPercent}%`
          : "-"
      }`,
      size: 9.5,
      spacingAfter: 3,
    })),
    { text: "", size: 6, spacingAfter: 6 },
    { text: "3. Average Stage Turnaround Times", size: 12, bold: true, accent: true, spacingAfter: 6 },
    ...(report.stageTurnarounds.length
      ? report.stageTurnarounds.map((st) => ({
          text: `${st.stageName}: Avg ${formatTurnaroundHours(st.averageHours)} | Median ${formatTurnaroundHours(st.medianHours)} | Transitions: ${st.transitions} | Current: ${st.currentCount}`,
          size: 9.5,
          spacingAfter: 3,
        }))
      : [{ text: "No stage transitions recorded yet.", size: 9.5, spacingAfter: 3 }]),
    { text: "", size: 6, spacingAfter: 6 },
    { text: "4. Participation by Sector / Category", size: 12, bold: true, accent: true, spacingAfter: 6 },
    ...(report.byCategory.length
      ? report.byCategory.map((cat) => ({
          text: `${cat.category}: ${cat.count} submissions (${cat.sharePercent}%)`,
          size: 9.5,
          spacingAfter: 3,
        }))
      : [{ text: "No categorized submissions yet.", size: 9.5, spacingAfter: 3 }]),
    { text: "", size: 6, spacingAfter: 6 },
    { text: "5. Applicant Demographics", size: 12, bold: true, accent: true, spacingAfter: 6 },
    {
      text: `Unique submitters: ${report.demographics.uniqueSubmitters}`,
      size: 9.5,
      bold: true,
      spacingAfter: 4,
    },
    ...report.demographics.stakeholderTypes.map((item) => ({
      text: `Stakeholder - ${item.name}: ${item.count} (${item.sharePercent}%)`,
      size: 9.5,
      spacingAfter: 3,
    })),
    ...report.demographics.organisationAffiliation.map((item) => ({
      text: `Affiliation - ${item.name}: ${item.count} (${item.sharePercent}%)`,
      size: 9.5,
      spacingAfter: 3,
    })),
    { text: "", size: 6, spacingAfter: 6 },
    { text: "6. Live Support Chat Analytics", size: 12, bold: true, accent: true, spacingAfter: 6 },
    {
      text: `Total chats: ${report.chatAnalytics.totalConversations} (Last 7d: ${report.chatAnalytics.conversationsLast7Days}) | Messages: ${report.chatAnalytics.totalMessages}`,
      size: 9.5,
      spacingAfter: 3,
    },
    {
      text: `Queue: ${report.chatAnalytics.waitingCount} waiting | ${report.chatAnalytics.activeCount} active | ${report.chatAnalytics.closedCount} resolved (${report.chatAnalytics.resolutionRatePercent !== null ? `${report.chatAnalytics.resolutionRatePercent}%` : "-"})`,
      size: 9.5,
      spacingAfter: 3,
    },
    {
      text: `Avg first response: ${formatDurationSeconds(report.chatAnalytics.averageFirstResponseSeconds)} | Median: ${formatDurationSeconds(report.chatAnalytics.medianFirstResponseSeconds)} | Avg resolution: ${formatDurationSeconds(report.chatAnalytics.averageResolutionSeconds)}`,
      size: 9.5,
      spacingAfter: 8,
    },
    { text: "7. Evaluator Workload", size: 12, bold: true, accent: true, spacingAfter: 6 },
    ...(report.evaluatorWorkload.length
      ? report.evaluatorWorkload.map((row) => ({
          text: `${row.evaluatorName}: Pending ${row.pending} | In progress ${row.inProgress} | Submitted ${row.submitted} | Declined ${row.declined}`,
          size: 9.5,
          spacingAfter: 3,
        }))
      : [{ text: "No evaluator assignments yet.", size: 9.5, spacingAfter: 3 }]),
  ];

  // Paginate onto A4 pages (595 x 842 pt)
  const pageWidth = 595;
  const pageHeight = 842;
  const marginX = 48;
  const topY = pageHeight - 54;
  const minY = 56;

  const pages: string[][] = [[]];
  let y = topY;

  for (const line of lines) {
    const lineHeight = line.size + (line.spacingAfter ?? 4);
    if (y - lineHeight < minY) {
      pages.push([]);
      y = topY;
    }
    const text = sanitizePdfText(line.text);
    if (text) {
      const font = line.bold ? "/F2" : "/F1";
      const color = line.accent ? "0.478 0.122 0.078 rg" : "0.20 0.12 0.09 rg";
      const truncated = text.slice(0, 105);
      pages[pages.length - 1].push(
        `BT ${color} ${font} ${line.size} Tf ${marginX} ${y.toFixed(1)} Td (${truncated}) Tj ET`,
      );
    }
    y -= lineHeight;
  }

  // Assemble PDF objects
  const objects: string[] = [];
  // 1: Catalog, 2: Pages, 3: Helvetica, 4: Helvetica-Bold
  const pageObjNums: number[] = [];
  const contentObjNums: number[] = [];
  let nextObjNum = 5;

  for (let i = 0; i < pages.length; i += 1) {
    pageObjNums.push(nextObjNum);
    contentObjNums.push(nextObjNum + 1);
    nextObjNum += 2;
  }

  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj\n`,
  );
  objects.push(
    "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  );
  objects.push(
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
  );

  for (let i = 0; i < pages.length; i += 1) {
    const footer = `BT 0.45 0.37 0.31 rg /F1 8 Tf ${marginX} 32 Td (CEDA Innovation Portal Report - Page ${i + 1} of ${pages.length}) Tj ET`;
    const streamBody = [...pages[i], footer].join("\n");
    const streamBytes = Buffer.byteLength(streamBody, "utf8");
    const pageNum = pageObjNums[i];
    const contentNum = contentObjNums[i];

    objects.push(
      `${pageNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNum} 0 R >>\nendobj\n`,
    );
    objects.push(
      `${contentNum} 0 obj\n<< /Length ${streamBytes} >>\nstream\n${streamBody}\nendstream\nendobj\n`,
    );
  }

  const header = "%PDF-1.4\n";
  let body = header;
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(Buffer.byteLength(body, "utf8"));
    body += obj;
  }

  const xrefOffset = Buffer.byteLength(body, "utf8");
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(body + xref + trailer, "utf8"));
}
