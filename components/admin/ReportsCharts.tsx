"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import {
  formatTurnaroundHours,
  type ExecutiveReportData,
} from "@/lib/reports-analytics";

const CEDA_PALETTE = [
  "#7A1F14", // CEDA burgundy
  "#E8710A", // CEDA orange
  "#A93B2B", // warm brick
  "#D4914A", // warm gold
  "#5C150D", // deep burgundy
  "#7F5E4E", // warm muted
];

const FUNNEL_COLORS = [
  "#7A1F14",
  "#9B2C1E",
  "#C64E18",
  "#E8710A",
  "#16803C",
];

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-ceda-line bg-[#FFFDFC] px-6 text-center text-sm text-ceda-muted">
      {message}
    </div>
  );
}

export function ReportExportActions() {
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <a
        href="/api/admin/reports/export?format=csv"
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ceda-line bg-white px-4 text-xs font-bold text-ceda-burgundy transition hover:bg-[#FFF9F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
        <FileSpreadsheet aria-hidden="true" className="h-4 w-4" />
        Export CSV
      </a>
      <a
        href="/api/admin/reports/export?format=pdf"
        className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ceda-burgundy px-4 text-xs font-bold text-white transition hover:bg-[#5C150D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
        <FileText aria-hidden="true" className="h-4 w-4" />
        Download PDF
        <Download aria-hidden="true" className="h-3.5 w-3.5" />
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ceda-line bg-white px-4 text-xs font-semibold text-ceda-ink transition hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
        <Printer aria-hidden="true" className="h-4 w-4" />
        Print visual report
      </button>
    </div>
  );
}

export function ReportsCharts({ report }: { report: ExecutiveReportData }) {
  const funnelData = report.stageFunnel.map((step, index) => ({
    ...step,
    fill: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
  }));

  const hasFunnelData = funnelData.some((step) => step.count > 0);
  const turnaroundChartData = report.stageTurnarounds.map((item) => ({
    ...item,
    hoursValue: item.averageHours ?? 0,
  }));
  const hasTurnaroundData = turnaroundChartData.some(
    (item) => item.averageHours !== null,
  );
  const hasStakeholders = report.demographics.stakeholderTypes.some(
    (item) => item.count > 0,
  );

  return (
    <div className="mt-8 space-y-8">
      {/* Row 1: Submission Activity Line/Area Chart + Stage Conversion Funnel */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="trend-chart-heading"
          className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-4">
            <h2
              id="trend-chart-heading"
              className="text-lg font-bold text-ceda-ink">
              Submission activity trend
            </h2>
            <p className="mt-1 text-xs text-ceda-muted">
              Submitted proposals vs approved/awarded outcomes across recent
              active dates.
            </p>
          </div>
          {report.submissionTrend.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={report.submissionTrend}
                  margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cedaSubFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7A1F14" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#7A1F14" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="cedaAppFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E8710A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E8710A" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEDFD7" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#7F5E4E" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#7F5E4E" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      borderColor: "#E5CFC3",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Area
                    type="monotone"
                    dataKey="submitted"
                    name="Submitted"
                    stroke="#7A1F14"
                    strokeWidth={2.5}
                    fill="url(#cedaSubFill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="approvedOrAwarded"
                    name="Approved / Awarded"
                    stroke="#E8710A"
                    strokeWidth={2.5}
                    fill="url(#cedaAppFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChartState message="Submission trends will appear once proposals are logged." />
          )}
        </section>

        <section
          aria-labelledby="funnel-chart-heading"
          className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-4">
            <h2
              id="funnel-chart-heading"
              className="text-lg font-bold text-ceda-ink">
              Pipeline stage conversion funnel
            </h2>
            <p className="mt-1 text-xs text-ceda-muted">
              Progression and conversion yield from initial submission to final
              award.
            </p>
          </div>
          {hasFunnelData ? (
            <>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        borderColor: "#E5CFC3",
                        fontSize: "12px",
                      }}
                    />
                    <Funnel dataKey="count" data={funnelData} isAnimationActive={false}>
                      <LabelList
                        position="right"
                        fill="#331F17"
                        stroke="none"
                        dataKey="label"
                        style={{ fontSize: "11px", fontWeight: 600 }}
                      />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-ceda-line pt-3 sm:grid-cols-5">
                {report.stageFunnel.map((step) => (
                  <div
                    key={step.stageKey}
                    className="rounded-lg bg-[#FFF9F4] p-2.5 text-center">
                    <dt className="truncate text-[10px] font-bold uppercase tracking-wide text-ceda-muted">
                      {step.label}
                    </dt>
                    <dd className="mt-1 text-base font-bold text-ceda-ink">
                      {step.count}
                    </dd>
                    <dd className="text-[11px] font-semibold text-ceda-burgundy">
                      {step.conversionFromPreviousPercent !== null
                        ? `${step.conversionFromPreviousPercent}% conv.`
                        : "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <EmptyChartState message="No submitted proposals have entered the review funnel yet." />
          )}
        </section>
      </div>

      {/* Row 2: Participation by Sector/Category + Stage Turnaround Times */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="category-chart-heading"
          className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-4">
            <h2
              id="category-chart-heading"
              className="text-lg font-bold text-ceda-ink">
              Participation by sector &amp; category
            </h2>
            <p className="mt-1 text-xs text-ceda-muted">
              Submission volume and percentage share across active CEDA sectors.
            </p>
          </div>
          {report.byCategory.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={report.byCategory}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#EEDFD7"
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#7F5E4E" }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={136}
                    tick={{ fontSize: 11, fill: "#331F17" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      borderColor: "#E5CFC3",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Submissions"
                    radius={[0, 8, 8, 0]}
                    barSize={24}>
                    {report.byCategory.map((entry, idx) => (
                      <Cell
                        key={entry.category}
                        fill={CEDA_PALETTE[idx % CEDA_PALETTE.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChartState message="Sector participation will appear once submissions are created." />
          )}
        </section>

        <section
          aria-labelledby="turnaround-chart-heading"
          className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-4">
            <h2
              id="turnaround-chart-heading"
              className="text-lg font-bold text-ceda-ink">
              Average turnaround per workflow stage
            </h2>
            <p className="mt-1 text-xs text-ceda-muted">
              Mean dwell time (hours) from stage entry to next workflow
              transition.
            </p>
          </div>
          {hasTurnaroundData ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={turnaroundChartData}
                  margin={{ top: 8, right: 16, left: -10, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEDFD7" />
                  <XAxis
                    dataKey="stageName"
                    tick={{ fontSize: 11, fill: "#7F5E4E" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#7F5E4E" }}
                    tickLine={false}
                    unit="h"
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatTurnaroundHours(
                        typeof value === "number" ? value : Number(value),
                      ),
                      "Avg turnaround",
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      borderColor: "#E5CFC3",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="hoursValue"
                    name="Avg hours"
                    fill="#E8710A"
                    radius={[8, 8, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChartState message="Stage turnaround timings populate as proposals move across workflow stages." />
          )}
        </section>
      </div>

      {/* Row 3: Stage Turnaround Table + Applicant Demographics */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section
          aria-labelledby="turnaround-table-heading"
          className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6">
          <h2
            id="turnaround-table-heading"
            className="text-lg font-bold text-ceda-ink">
            Workflow stage turnaround breakdown
          </h2>
          <p className="mt-1 text-xs text-ceda-muted">
            Completed stage transitions, current queue volume, and average vs
            median turnaround timelines.
          </p>
          {report.stageTurnarounds.length > 0 ? (
            <div className="mt-4 overflow-x-auto rounded-xl border border-ceda-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FFF9F4] text-xs text-ceda-muted">
                  <tr>
                    <th scope="col" className="p-3">
                      Stage
                    </th>
                    <th scope="col" className="p-3">
                      Current
                    </th>
                    <th scope="col" className="p-3">
                      Transitions
                    </th>
                    <th scope="col" className="p-3">
                      Avg time
                    </th>
                    <th scope="col" className="p-3">
                      Median
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ceda-line">
                  {report.stageTurnarounds.map((row) => (
                    <tr key={row.stageName}>
                      <th
                        scope="row"
                        className="p-3 font-semibold text-ceda-ink">
                        {row.stageName}
                      </th>
                      <td className="p-3">{row.currentCount}</td>
                      <td className="p-3">{row.transitions}</td>
                      <td className="p-3 font-semibold text-ceda-burgundy">
                        {formatTurnaroundHours(row.averageHours)}
                      </td>
                      <td className="p-3 text-ceda-muted">
                        {formatTurnaroundHours(row.medianHours)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-[#FFF9F4] p-4 text-sm text-ceda-muted">
              No workflow stage history recorded yet.
            </p>
          )}
        </section>

        <section
          aria-labelledby="demographics-heading"
          className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2
                id="demographics-heading"
                className="text-lg font-bold text-ceda-ink">
                Applicant demographics
              </h2>
              <p className="mt-1 text-xs text-ceda-muted">
                Profile breakdown across {report.demographics.uniqueSubmitters}{" "}
                unique{" "}
                {report.demographics.uniqueSubmitters === 1
                  ? "submitter"
                  : "submitters"}
                .
              </p>
            </div>
          </div>

          {hasStakeholders ? (
            <div className="mt-3 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={report.demographics.stakeholderTypes}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={72}
                    paddingAngle={3}>
                    {report.demographics.stakeholderTypes.map((entry, idx) => (
                      <Cell
                        key={entry.name}
                        fill={CEDA_PALETTE[idx % CEDA_PALETTE.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      borderColor: "#E5CFC3",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChartState message="Applicant demographic profiles will appear once submitters apply." />
          )}

          <div className="mt-4 grid gap-3 border-t border-ceda-line pt-4 sm:grid-cols-2">
            {report.demographics.organisationAffiliation.map((item) => (
              <div
                key={item.name}
                className="rounded-xl bg-[#FFF9F4] px-3.5 py-3">
                <p className="text-xs text-ceda-muted">{item.name}</p>
                <p className="mt-1 text-lg font-bold text-ceda-ink">
                  {item.count}{" "}
                  <span className="text-xs font-semibold text-ceda-burgundy">
                    ({item.sharePercent}%)
                  </span>
                </p>
              </div>
            ))}
          </div>

          {report.demographics.solutionMaturity.length > 0 && (
            <div className="mt-4 border-t border-ceda-line pt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-ceda-muted">
                Solution maturity stage
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {report.demographics.solutionMaturity.map((item) => (
                  <li
                    key={item.name}
                    className="rounded-full border border-ceda-line bg-[#FFFDFC] px-3 py-1 text-xs font-medium text-ceda-ink">
                    {item.name}: <strong>{item.count}</strong> (
                    {item.sharePercent}%)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.demographics.topOrganisations.length > 0 && (
            <div className="mt-4 border-t border-ceda-line pt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-ceda-muted">
                Top participating organisations
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-ceda-body">
                {report.demographics.topOrganisations.map((org) => (
                  <li
                    key={org.name}
                    className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-ceda-ink">
                      {org.name}
                    </span>
                    <span className="font-bold text-ceda-burgundy">
                      {org.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
