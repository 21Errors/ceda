"use client";

import type { ExecutiveReportData } from "@/lib/reports-analytics";
import { CategoryParticipationChart } from "./reports/CategoryParticipationChart";
import { DemographicsPanel } from "./reports/DemographicsPanel";
import { ReportExportActions } from "./reports/ReportExportActions";
import { StageFunnelChart } from "./reports/StageFunnelChart";
import {
  StageTurnaroundChart,
  StageTurnaroundTable,
} from "./reports/StageTurnaroundPanel";
import { SubmissionTrendChart } from "./reports/SubmissionTrendChart";

export { ReportExportActions };

export function ReportsCharts({ report }: { report: ExecutiveReportData }) {
  return (
    <div className="mt-8 space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <SubmissionTrendChart data={report.submissionTrend} />
        <StageFunnelChart stageFunnel={report.stageFunnel} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryParticipationChart byCategory={report.byCategory} />
        <StageTurnaroundChart stageTurnarounds={report.stageTurnarounds} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <StageTurnaroundTable stageTurnarounds={report.stageTurnarounds} />
        <DemographicsPanel demographics={report.demographics} />
      </div>
    </div>
  );
}
