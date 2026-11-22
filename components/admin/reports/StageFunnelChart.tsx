"use client";

import { Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip } from "recharts";
import type { ExecutiveReportData } from "@/lib/reports-analytics";
import { CHART_TOOLTIP_STYLE, EmptyChartState, FUNNEL_COLORS } from "./ChartShared";

export function StageFunnelChart({
  stageFunnel,
}: {
  stageFunnel: ExecutiveReportData["stageFunnel"];
}) {
  const funnelData = stageFunnel.map((step, index) => ({
    ...step,
    fill: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
  }));
  const hasFunnelData = funnelData.some((step) => step.count > 0);

  return (
    <section
      aria-labelledby="funnel-chart-heading"
      className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="mb-4">
        <h2 id="funnel-chart-heading" className="text-lg font-bold text-ceda-ink">
          Pipeline stage conversion funnel
        </h2>
        <p className="mt-1 text-xs text-ceda-muted">
          Progression and conversion yield from initial submission to final award.
        </p>
      </div>
      {hasFunnelData ? (
        <>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
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
            {stageFunnel.map((step) => (
              <div
                key={step.stageKey}
                className="rounded-lg bg-[#FFF9F4] p-2.5 text-center"
              >
                <dt className="truncate text-[10px] font-bold uppercase tracking-wide text-ceda-muted">
                  {step.label}
                </dt>
                <dd className="mt-1 text-base font-bold text-ceda-ink">{step.count}</dd>
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
  );
}
