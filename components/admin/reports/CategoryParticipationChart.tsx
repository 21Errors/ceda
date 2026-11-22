"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ExecutiveReportData } from "@/lib/reports-analytics";
import { CEDA_PALETTE, CHART_TOOLTIP_STYLE, EmptyChartState } from "./ChartShared";

export function CategoryParticipationChart({
  byCategory,
}: {
  byCategory: ExecutiveReportData["byCategory"];
}) {
  return (
    <section
      aria-labelledby="category-chart-heading"
      className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="mb-4">
        <h2 id="category-chart-heading" className="text-lg font-bold text-ceda-ink">
          Participation by sector &amp; category
        </h2>
        <p className="mt-1 text-xs text-ceda-muted">
          Submission volume and percentage share across active CEDA sectors.
        </p>
      </div>
      {byCategory.length > 0 ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={byCategory}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
            >
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
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar
                dataKey="count"
                name="Submissions"
                radius={[0, 8, 8, 0]}
                barSize={24}
              >
                {byCategory.map((entry, idx) => (
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
  );
}
