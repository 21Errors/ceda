"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ExecutiveReportData } from "@/lib/reports-analytics";
import { CHART_TOOLTIP_STYLE, EmptyChartState } from "./ChartShared";

export function SubmissionTrendChart({
  data,
}: {
  data: ExecutiveReportData["submissionTrend"];
}) {
  return (
    <section
      aria-labelledby="trend-chart-heading"
      className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="mb-4">
        <h2 id="trend-chart-heading" className="text-lg font-bold text-ceda-ink">
          Submission activity trend
        </h2>
        <p className="mt-1 text-xs text-ceda-muted">
          Submitted proposals vs approved/awarded outcomes across recent active dates.
        </p>
      </div>
      {data.length > 0 ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
            >
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
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
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
  );
}
