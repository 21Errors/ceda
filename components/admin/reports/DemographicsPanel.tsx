"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ExecutiveReportData } from "@/lib/reports-analytics";
import { CEDA_PALETTE, CHART_TOOLTIP_STYLE, EmptyChartState } from "./ChartShared";

export function DemographicsPanel({
  demographics,
}: {
  demographics: ExecutiveReportData["demographics"];
}) {
  const hasStakeholders = demographics.stakeholderTypes.some(
    (item) => item.count > 0,
  );

  return (
    <section
      aria-labelledby="demographics-heading"
      className="rounded-2xl border border-ceda-line bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 id="demographics-heading" className="text-lg font-bold text-ceda-ink">
            Applicant demographics
          </h2>
          <p className="mt-1 text-xs text-ceda-muted">
            Profile breakdown across {demographics.uniqueSubmitters} unique{" "}
            {demographics.uniqueSubmitters === 1 ? "submitter" : "submitters"}.
          </p>
        </div>
      </div>

      {hasStakeholders ? (
        <div className="mt-3 h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={demographics.stakeholderTypes}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={72}
                paddingAngle={3}
              >
                {demographics.stakeholderTypes.map((entry, idx) => (
                  <Cell
                    key={entry.name}
                    fill={CEDA_PALETTE[idx % CEDA_PALETTE.length]}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChartState message="Applicant demographic profiles will appear once submitters apply." />
      )}

      <div className="mt-4 grid gap-3 border-t border-ceda-line pt-4 sm:grid-cols-2">
        {demographics.organisationAffiliation.map((item) => (
          <div key={item.name} className="rounded-xl bg-[#FFF9F4] px-3.5 py-3">
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

      {demographics.solutionMaturity.length > 0 && (
        <div className="mt-4 border-t border-ceda-line pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-ceda-muted">
            Solution maturity stage
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {demographics.solutionMaturity.map((item) => (
              <li
                key={item.name}
                className="rounded-full border border-ceda-line bg-[#FFFDFC] px-3 py-1 text-xs font-medium text-ceda-ink"
              >
                {item.name}: <strong>{item.count}</strong> ({item.sharePercent}%)
              </li>
            ))}
          </ul>
        </div>
      )}

      {demographics.topOrganisations.length > 0 && (
        <div className="mt-4 border-t border-ceda-line pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-ceda-muted">
            Top participating organisations
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-ceda-body">
            {demographics.topOrganisations.map((org) => (
              <li
                key={org.name}
                className="flex items-center justify-between gap-2"
              >
                <span className="truncate font-medium text-ceda-ink">
                  {org.name}
                </span>
                <span className="font-bold text-ceda-burgundy">{org.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
