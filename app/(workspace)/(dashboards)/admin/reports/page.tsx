import Link from "next/link";
import { Suspense } from "react";
import {
  ReportExportActions,
  ReportsCharts,
} from "@/components/admin/ReportsCharts";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { requireRole } from "@/lib/authorization";
import { formatDurationSeconds } from "@/lib/chat-analytics-calc";
import { getExecutiveReportData } from "@/lib/server/reports-service";

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="table" />}>
      <ReportsContent />
    </Suspense>
  );
}

async function ReportsContent() {
  await requireRole("admin", "/admin/reports");
  const report = await getExecutiveReportData();
  const { totals, chatAnalytics } = report;

  return (
    <main
      id="main-content"
      className="flex-1 bg-white px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-275">
        <Link
          href="/admin"
          className="text-sm font-semibold text-ceda-burgundy underline underline-offset-4 print:hidden">
          ← Back to administration
        </Link>

        <header className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
              Executive &amp; operational analytics
            </p>
            <h1 className="mt-2 text-3xl font-bold text-ceda-ink">
              Reports &amp; Analytics
            </h1>
            <p className="mt-2 text-sm leading-6 text-ceda-muted">
              Live submission trends, sector participation, applicant
              demographics, stage conversion funnels, turnaround timelines, and
              support chat metrics.
            </p>
          </div>
          <ReportExportActions />
        </header>

        {/* Top KPI cards */}
        <section
          className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Submission outcomes">
          {[
            {
              label: "All submissions",
              value: totals.allSubmissions,
              detail: `${totals.submittedOrBeyond} submitted · ${totals.drafts} drafts`,
            },
            {
              label: "In review",
              value: totals.inReview,
              detail: `${totals.changesRequested} changes requested`,
            },
            {
              label: "Approved or awarded",
              value: totals.approved + totals.awarded,
              detail: `${totals.awarded} formally awarded`,
            },
            {
              label: "Unique submitters",
              value: report.demographics.uniqueSubmitters,
              detail: `${report.byCall.length} active ${report.byCall.length === 1 ? "call" : "calls"}`,
            },
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-ceda-line bg-[#FFF9F4] p-5">
              <p className="text-sm text-ceda-muted">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-ceda-ink">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-ceda-muted">{item.detail}</p>
            </article>
          ))}
        </section>

        {/* Visual Recharts suite (Trend, Funnel, Category, Turnaround, Demographics) */}
        <ReportsCharts report={report} />

        {/* Call participation & Evaluator workload */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="call-report-heading">
            <h2
              id="call-report-heading"
              className="text-xl font-bold text-ceda-ink">
              Participation by call
            </h2>
            {report.byCall.length ? (
              <ul className="mt-3 divide-y divide-ceda-line rounded-xl border border-ceda-line">
                {report.byCall.map((row) => (
                  <li
                    key={row.callTitle}
                    className="flex items-center justify-between gap-4 p-4 text-sm">
                    <span className="text-ceda-ink">{row.callTitle}</span>
                    <span className="font-bold text-ceda-burgundy">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl bg-[#FFF9F4] p-4 text-sm text-ceda-muted">
                No submissions yet.
              </p>
            )}
          </section>

          <section aria-labelledby="workload-report-heading">
            <h2
              id="workload-report-heading"
              className="text-xl font-bold text-ceda-ink">
              Evaluator workload
            </h2>
            {report.evaluatorWorkload.length ? (
              <div className="mt-3 overflow-x-auto rounded-xl border border-ceda-line">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#FFF9F4] text-xs text-ceda-muted">
                    <tr>
                      <th scope="col" className="p-3">
                        Evaluator
                      </th>
                      <th scope="col" className="p-3">
                        Pending
                      </th>
                      <th scope="col" className="p-3">
                        In progress
                      </th>
                      <th scope="col" className="p-3">
                        Submitted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ceda-line">
                    {report.evaluatorWorkload.map((row) => (
                      <tr key={row.evaluatorName}>
                        <th
                          scope="row"
                          className="p-3 font-semibold text-ceda-ink">
                          {row.evaluatorName}
                        </th>
                        <td className="p-3">{row.pending}</td>
                        <td className="p-3">{row.inProgress}</td>
                        <td className="p-3">{row.submitted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-[#FFF9F4] p-4 text-sm text-ceda-muted">
                No evaluator assignments yet.
              </p>
            )}
          </section>
        </div>

        {/* Live Support Chat Analytics */}
        <section
          className="mt-10 border-t border-ceda-line pt-8"
          aria-labelledby="chat-analytics-heading">
          <h2
            id="chat-analytics-heading"
            className="text-xl font-bold text-ceda-ink">
            Live support chat analytics
          </h2>
          <p className="mt-1 text-sm text-ceda-muted">
            Support volume, first-response times, and resolution metrics across
            service desk conversations.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Total conversations",
                value: String(chatAnalytics.totalConversations),
                detail: `${chatAnalytics.conversationsLast7Days} in last 7 days · ${chatAnalytics.totalMessages} messages`,
              },
              {
                label: "Current queue",
                value: `${chatAnalytics.waitingCount} waiting`,
                detail: `${chatAnalytics.activeCount} active · ${chatAnalytics.closedCount} resolved`,
              },
              {
                label: "Avg first response",
                value: formatDurationSeconds(
                  chatAnalytics.averageFirstResponseSeconds,
                ),
                detail: `Median ${formatDurationSeconds(chatAnalytics.medianFirstResponseSeconds)}`,
              },
              {
                label: "Resolution rate",
                value:
                  chatAnalytics.resolutionRatePercent !== null
                    ? `${chatAnalytics.resolutionRatePercent}%`
                    : "—",
                detail: `Avg resolution ${formatDurationSeconds(chatAnalytics.averageResolutionSeconds)}`,
              },
            ].map((card) => (
              <article
                key={card.label}
                className="rounded-2xl border border-ceda-line bg-[#FFF9F4] p-5">
                <p className="text-sm text-ceda-muted">{card.label}</p>
                <p className="mt-2 text-2xl font-bold text-ceda-ink">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-ceda-muted">{card.detail}</p>
              </article>
            ))}
          </div>

          {chatAnalytics.consultantBreakdown.length > 0 && (
            <div className="mt-5 overflow-x-auto rounded-xl border border-ceda-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FFF9F4] text-xs text-ceda-muted">
                  <tr>
                    <th scope="col" className="p-3">
                      Consultant
                    </th>
                    <th scope="col" className="p-3">
                      Active chats
                    </th>
                    <th scope="col" className="p-3">
                      Resolved
                    </th>
                    <th scope="col" className="p-3">
                      Avg first response
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ceda-line">
                  {chatAnalytics.consultantBreakdown.map((row) => (
                    <tr key={row.agentId}>
                      <th
                        scope="row"
                        className="p-3 font-semibold text-ceda-ink">
                        {row.agentName}
                      </th>
                      <td className="p-3">{row.activeChats}</td>
                      <td className="p-3">{row.resolvedChats}</td>
                      <td className="p-3">
                        {formatDurationSeconds(row.averageFirstResponseSeconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
