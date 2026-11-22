import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/authorization";
import { buildExecutiveReportCsv } from "@/lib/reports-analytics";
import { writeAudit } from "@/lib/server/audit";
import { buildExecutiveReportPdf } from "@/lib/server/report-pdf";
import { getExecutiveReportData } from "@/lib/server/reports-service";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const roles = await getUserRoles(session.user.id);
  if (!roles.includes("admin")) {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  const formatParam = new URL(request.url).searchParams.get("format")?.toLowerCase();
  const format = formatParam === "pdf" ? "pdf" : "csv";

  const report = await getExecutiveReportData();
  const dateStamp = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Gaborone",
  }).format(new Date());

  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actorId: session.user.id,
      action: "report.exported",
      entityType: "report",
      entityId: format,
      metadata: { format, totalSubmissions: report.totals.allSubmissions },
    });
  });

  if (format === "pdf") {
    const pdfBytes = buildExecutiveReportPdf(report);
    const pdfBuffer = Buffer.from(pdfBytes);
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ceda-analytics-report-${dateStamp}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const csv = buildExecutiveReportCsv(report);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ceda-analytics-report-${dateStamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
