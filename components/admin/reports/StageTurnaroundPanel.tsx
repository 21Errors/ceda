"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatTurnaroundHours,
  type ExecutiveReportData,
} from "@/lib/reports-analytics";
import { CHART_TOOLTIP_STYLE, EmptyChartState } from "./ChartShared";

export function StageTurnaroundChart({
  stageTurnarounds,
}: {
  stageTurnarounds: ExecutiveReportData["stageTurnarounds"];
}) {
  const turnaroundChartData = stageTurnarounds.map((item) => ({
    ...item,
    hoursValue: item.averageHours ?? 0,
  }));
  const hasTurnaroundData = turnaroundChartData.some(
    (item) => item.averageHours !== null,
  );

  return (
    <section
      aria-labelledby="turnaround-chart-heading"
      className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="mb-4">
        <h2 id="turnaround-chart-heading" className="text-lg font-bold text-ceda-ink">
          Average turnaround per workflow stage
        </h2>
        <p className="mt-1 text-xs text-ceda-muted">
          Mean dwell time (hours) from stage entry to next workflow transition.
        </p>
      </div>
      {hasTurnaroundData ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={turnaroundChartData}
              margin={{ top: 8, right: 16, left: -10, bottom: 8 }}
            >
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
                contentStyle={CHART_TOOLTIP_STYLE}
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
  );
}

export function StageTurnaroundTable({
  stageTurnarounds,
}: {
  stageTurnarounds: ExecutiveReportData["stageTurnarounds"];
}) {
  return (
    <section
      aria-labelledby="turnaround-table-heading"
      className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6"
    >
      <h2 id="turnaround-table-heading" className="text-lg font-bold text-ceda-ink">
        Workflow stage turnaround breakdown
      </h2>
      <p className="mt-1 text-xs text-ceda-muted">
        Completed stage transitions, current queue volume, and average vs median turnaround timelines.
      </p>
      {stageTurnarounds.length > 0 ? (
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
              {stageTurnarounds.map((row) => (
                <tr key={row.stageName}>
                  <th scope="row" className="p-3 font-semibold text-ceda-ink">
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
  );
}
