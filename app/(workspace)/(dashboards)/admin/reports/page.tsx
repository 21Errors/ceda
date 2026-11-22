import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { Suspense } from "react";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { db } from "@/db";
import {
  evaluatorAssignments,
  ideas,
  innovationCalls,
  user,
} from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import { formatDurationSeconds } from "@/lib/chat-analytics-calc";
import { getChatAnalyticsSummary } from "@/lib/server/chat-service";

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="table" />}>
      <ReportsContent />
    </Suspense>
  );
}

async function ReportsContent() {
  await requireRole("admin", "/admin/reports");
  const [totalRows, statusRows, callRows, workloadRows, chatAnalytics] =
    await Promise.all([
      db.select({ total: count() }).from(ideas),
      db
        .select({ status: ideas.status, total: count() })
        .from(ideas)
        .groupBy(ideas.status),
      db
        .select({ callTitle: innovationCalls.title, total: count() })
        .from(ideas)
        .innerJoin(innovationCalls, eq(ideas.callId, innovationCalls.id))
        .groupBy(innovationCalls.id, innovationCalls.title)
        .orderBy(desc(count()))
        .limit(10),
      db
        .select({
          evaluatorName: user.name,
          status: evaluatorAssignments.status,
          total: count(),
        })
        .from(evaluatorAssignments)
        .innerJoin(user, eq(evaluatorAssignments.evaluatorId, user.id))
        .groupBy(user.id, user.name, evaluatorAssignments.status)
        .orderBy(user.name),
      getChatAnalyticsSummary(),
    ]);
  const total = Number(totalRows[0]?.total ?? 0);
  const statuses = new Map(
    statusRows.map((row) => [row.status, Number(row.total)]),
  );
  const workload = new Map<
    string,
    { pending: number; inProgress: number; submitted: number; declined: number }
  >();
  for (const row of workloadRows) {
    const counts = workload.get(row.evaluatorName) ?? {
      pending: 0,
      inProgress: 0,
      submitted: 0,
      declined: 0,
    };
    counts[row.status === "in_progress" ? "inProgress" : row.status] = Number(
      row.total,
    );
    workload.set(row.evaluatorName, counts);
  }

  return (
    <main
      id="main-content"
      className="flex-1 bg-white px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-275">
        <Link
          href="/admin"
          className="text-sm font-semibold text-ceda-burgundy underline underline-offset-4">
          ← Back to administration
        </Link>
        <header className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
            Portal activity
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ceda-ink">Reports</h1>
          <p className="mt-2 text-sm leading-6 text-ceda-muted">
            Live aggregate counts from submissions and evaluator assignments.
          </p>
        </header>
        <section
          className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Submission outcomes">
          {[
            { label: "All submissions", value: total },
            { label: "In review", value: statuses.get("in_review") ?? 0 },
            {
              label: "Changes requested",
              value: statuses.get("changes_requested") ?? 0,
            },
            {
              label: "Approved or awarded",
              value:
                (statuses.get("approved") ?? 0) +
                (statuses.get("awarded") ?? 0),
            },
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-ceda-line bg-[#FFF9F4] p-5">
              <p className="text-sm text-ceda-muted">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-ceda-ink">
                {item.value}
              </p>
            </article>
          ))}
        </section>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="call-report-heading">
            <h2
              id="call-report-heading"
              className="text-xl font-bold text-ceda-ink">
              Participation by call
            </h2>
            {callRows.length ? (
              <ul className="mt-3 divide-y divide-ceda-line rounded-xl border border-ceda-line">
                {callRows.map((row) => (
                  <li
                    key={row.callTitle}
                    className="flex items-center justify-between gap-4 p-4 text-sm">
                    <span className="text-ceda-ink">{row.callTitle}</span>
                    <span className="font-bold text-ceda-burgundy">
                      {row.total}
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
            {workload.size ? (
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
                    {[...workload].map(([name, value]) => (
                      <tr key={name}>
                        <th
                          scope="row"
                          className="p-3 font-semibold text-ceda-ink">
                          {name}
                        </th>
                        <td className="p-3">{value.pending}</td>
                        <td className="p-3">{value.inProgress}</td>
                        <td className="p-3">{value.submitted}</td>
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
