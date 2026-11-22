import type { ChatAnalyticsSummary } from "@/lib/chat-analytics-calc";
import { formatDurationSeconds } from "@/lib/chat-analytics-calc";

export interface ReportIdeaRow {
  id: string;
  status: string;
  callTitle: string;
  categoryName: string | null;
  stageId: string | null;
  stageName: string | null;
  stageType: string | null;
  createdAt: Date;
  submittedAt: Date | null;
  submitterId: string;
  isInternal: boolean | null;
  organisation: string | null;
  jobTitle: string | null;
  solutionStatus: string | null;
}

export interface ReportStageHistoryRow {
  ideaId: string;
  fromStageId: string | null;
  toStageId: string | null;
  toStageName: string | null;
  toStageType: string | null;
  toStatus: string;
  createdAt: Date;
}

export interface ReportEvaluatorWorkloadRow {
  evaluatorName: string;
  pending: number;
  inProgress: number;
  submitted: number;
  declined: number;
}

export interface CategoryMetric {
  category: string;
  count: number;
  sharePercent: number;
}

export interface TrendPoint {
  date: string;
  label: string;
  submitted: number;
  approvedOrAwarded: number;
}

export interface FunnelStepMetric {
  stageKey: "submission" | "review" | "feedback" | "approval" | "award";
  label: string;
  count: number;
  conversionFromPreviousPercent: number | null;
  conversionFromStartPercent: number | null;
}

export interface StageTurnaroundMetric {
  stageName: string;
  stageType: string;
  transitions: number;
  currentCount: number;
  averageHours: number | null;
  medianHours: number | null;
}

export interface DemographicBreakdown {
  stakeholderTypes: { name: string; count: number; sharePercent: number }[];
  organisationAffiliation: { name: string; count: number; sharePercent: number }[];
  solutionMaturity: { name: string; count: number; sharePercent: number }[];
  uniqueSubmitters: number;
  topOrganisations: { name: string; count: number }[];
}

export interface ExecutiveReportData {
  generatedAt: string;
  totals: {
    allSubmissions: number;
    drafts: number;
    submittedOrBeyond: number;
    inReview: number;
    changesRequested: number;
    approved: number;
    awarded: number;
    rejected: number;
    withdrawn: number;
  };
  byStatus: { status: string; label: string; count: number }[];
  byCall: { callTitle: string; count: number }[];
  byCategory: CategoryMetric[];
  demographics: DemographicBreakdown;
  submissionTrend: TrendPoint[];
  stageFunnel: FunnelStepMetric[];
  stageTurnarounds: StageTurnaroundMetric[];
  evaluatorWorkload: ReportEvaluatorWorkloadRow[];
  chatAnalytics: ChatAnalyticsSummary;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  awarded: "Awarded",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
};

const FUNNEL_RANK: Record<string, number> = {
  submitted: 1,
  in_review: 2,
  changes_requested: 3,
  approved: 4,
  rejected: 4,
  awarded: 5,
};

function computeMedian(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1));
}

function toGaboroneDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Gaborone",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "2026";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

function toShortDateLabel(isoDate: string): string {
  const dt = new Date(`${isoDate}T12:00:00Z`);
  return dt.toLocaleDateString("en-BW", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function sharePercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export function formatTurnaroundHours(hours: number | null): string {
  if (hours === null || !Number.isFinite(hours)) return "—";
  if (hours < 1) {
    const mins = Math.max(1, Math.round(hours * 60));
    return `${mins}m`;
  }
  if (hours < 48) {
    return `${Number(hours.toFixed(1))}h`;
  }
  const days = Number((hours / 24).toFixed(1));
  return `${days}d`;
}

export function buildExecutiveReport(input: {
  ideas: readonly ReportIdeaRow[];
  stageHistory: readonly ReportStageHistoryRow[];
  evaluatorWorkload: readonly ReportEvaluatorWorkloadRow[];
  chatAnalytics: ChatAnalyticsSummary;
  now?: Date;
}): ExecutiveReportData {
  const now = input.now ?? new Date();
  const ideas = input.ideas;
  const statusCounts = new Map<string, number>();
  const callCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const maturityCounts = new Map<string, number>();
  const trendMap = new Map<string, { submitted: number; approvedOrAwarded: number }>();

  // Track unique submitters for demographic breakdown
  const submitterMap = new Map<
    string,
    { isInternal: boolean | null; organisation: string | null }
  >();

  for (const idea of ideas) {
    statusCounts.set(idea.status, (statusCounts.get(idea.status) ?? 0) + 1);
    callCounts.set(idea.callTitle, (callCounts.get(idea.callTitle) ?? 0) + 1);

    const cat = idea.categoryName?.trim() || "Uncategorized";
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);

    const maturity = idea.solutionStatus?.trim();
    if (maturity) {
      const normalized = maturity.replaceAll("_", " ");
      const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);
      maturityCounts.set(label, (maturityCounts.get(label) ?? 0) + 1);
    } else if (idea.status !== "draft") {
      maturityCounts.set(
        "Not specified",
        (maturityCounts.get("Not specified") ?? 0) + 1,
      );
    }

    if (!submitterMap.has(idea.submitterId)) {
      submitterMap.set(idea.submitterId, {
        isInternal: idea.isInternal,
        organisation: idea.organisation?.trim() || null,
      });
    }

    const activityDate = idea.submittedAt ?? idea.createdAt;
    const dateKey = toGaboroneDateKey(activityDate);
    const bucket = trendMap.get(dateKey) ?? {
      submitted: 0,
      approvedOrAwarded: 0,
    };
    if (idea.status !== "draft") {
      bucket.submitted += 1;
    }
    if (idea.status === "approved" || idea.status === "awarded") {
      bucket.approvedOrAwarded += 1;
    }
    trendMap.set(dateKey, bucket);
  }

  const allSubmissions = ideas.length;
  const drafts = statusCounts.get("draft") ?? 0;
  const inReview = statusCounts.get("in_review") ?? 0;
  const changesRequested = statusCounts.get("changes_requested") ?? 0;
  const approved = statusCounts.get("approved") ?? 0;
  const awarded = statusCounts.get("awarded") ?? 0;
  const rejected = statusCounts.get("rejected") ?? 0;
  const withdrawn = statusCounts.get("withdrawn") ?? 0;
  const submittedOrBeyond = allSubmissions - drafts;

  const byStatus = Object.entries(STATUS_LABELS).map(([status, label]) => ({
    status,
    label,
    count: statusCounts.get(status) ?? 0,
  }));

  const byCall = [...callCounts.entries()]
    .map(([callTitle, count]) => ({ callTitle, count }))
    .sort((a, b) => b.count - a.count || a.callTitle.localeCompare(b.callTitle));

  const byCategory: CategoryMetric[] = [...categoryCounts.entries()]
    .map(([category, count]) => ({
      category,
      count,
      sharePercent: sharePercent(count, allSubmissions),
    }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));

  // Demographics across unique submitters
  let externalCount = 0;
  let internalCount = 0;
  let unprofiledCount = 0;
  let orgAffiliatedCount = 0;
  let independentCount = 0;
  const orgCounts = new Map<string, number>();

  for (const profile of submitterMap.values()) {
    if (profile.isInternal === true) internalCount += 1;
    else if (profile.isInternal === false) externalCount += 1;
    else unprofiledCount += 1;

    if (profile.organisation) {
      orgAffiliatedCount += 1;
      orgCounts.set(
        profile.organisation,
        (orgCounts.get(profile.organisation) ?? 0) + 1,
      );
    } else {
      independentCount += 1;
    }
  }

  const uniqueSubmitters = submitterMap.size;
  const stakeholderTypes = [
    {
      name: "External innovators",
      count: externalCount,
      sharePercent: sharePercent(externalCount, uniqueSubmitters),
    },
    {
      name: "CEDA internal staff",
      count: internalCount,
      sharePercent: sharePercent(internalCount, uniqueSubmitters),
    },
    {
      name: "Profile pending",
      count: unprofiledCount,
      sharePercent: sharePercent(unprofiledCount, uniqueSubmitters),
    },
  ].filter((item) => item.count > 0 || uniqueSubmitters === 0);

  const organisationAffiliation = [
    {
      name: "Organisation / SME",
      count: orgAffiliatedCount,
      sharePercent: sharePercent(orgAffiliatedCount, uniqueSubmitters),
    },
    {
      name: "Independent innovator",
      count: independentCount,
      sharePercent: sharePercent(independentCount, uniqueSubmitters),
    },
  ];

  const maturityTotal = [...maturityCounts.values()].reduce((s, v) => s + v, 0);
  const solutionMaturity = [...maturityCounts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      sharePercent: sharePercent(count, maturityTotal),
    }))
    .sort((a, b) => b.count - a.count);

  const topOrganisations = [...orgCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 6);

  // Submission trend (chronological)
  const submissionTrend: TrendPoint[] = [...trendMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, counts]) => ({
      date,
      label: toShortDateLabel(date),
      submitted: counts.submitted,
      approvedOrAwarded: counts.approvedOrAwarded,
    }));

  // Stage funnel & turnaround timelines
  const historyByIdea = new Map<string, ReportStageHistoryRow[]>();
  for (const row of input.stageHistory) {
    const list = historyByIdea.get(row.ideaId) ?? [];
    list.push(row);
    historyByIdea.set(row.ideaId, list);
  }
  for (const list of historyByIdea.values()) {
    list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  let reachedSubmission = 0;
  let reachedReview = 0;
  let reachedFeedback = 0;
  let reachedApproval = 0;
  let reachedAward = 0;

  for (const idea of ideas) {
    if (idea.status === "draft") continue;
    const events = historyByIdea.get(idea.id) ?? [];
    const statusRank = FUNNEL_RANK[idea.status] ?? 1;
    const stageTypes = new Set(
      events.map((ev) => ev.toStageType).filter(Boolean) as string[],
    );
    const statusesSeen = new Set(events.map((ev) => ev.toStatus));
    if (idea.stageType) stageTypes.add(idea.stageType);

    reachedSubmission += 1;
    if (
      statusRank >= 2 ||
      stageTypes.has("screening") ||
      stageTypes.has("evaluation") ||
      statusesSeen.has("in_review")
    ) {
      reachedReview += 1;
    }
    if (
      statusRank >= 3 ||
      stageTypes.has("feedback") ||
      stageTypes.has("adjudication") ||
      statusesSeen.has("changes_requested")
    ) {
      reachedFeedback += 1;
    }
    if (
      idea.status === "approved" ||
      idea.status === "awarded" ||
      statusesSeen.has("approved")
    ) {
      reachedApproval += 1;
    }
    if (idea.status === "awarded" || stageTypes.has("award")) {
      reachedAward += 1;
    }
  }

  const rawFunnel: {
    stageKey: FunnelStepMetric["stageKey"];
    label: string;
    count: number;
  }[] = [
    { stageKey: "submission", label: "Submitted", count: reachedSubmission },
    { stageKey: "review", label: "Under Review", count: reachedReview },
    {
      stageKey: "feedback",
      label: "Feedback / Adjudication",
      count: reachedFeedback,
    },
    { stageKey: "approval", label: "Approved", count: reachedApproval },
    { stageKey: "award", label: "Awarded", count: reachedAward },
  ];

  const stageFunnel: FunnelStepMetric[] = rawFunnel.map((step, idx) => {
    const prevCount = idx > 0 ? rawFunnel[idx - 1].count : null;
    return {
      ...step,
      conversionFromPreviousPercent:
        prevCount !== null && prevCount > 0
          ? Math.round((step.count / prevCount) * 100)
          : idx === 0 && step.count > 0
            ? 100
            : null,
      conversionFromStartPercent:
        reachedSubmission > 0
          ? Math.round((step.count / reachedSubmission) * 100)
          : null,
    };
  });

  // Per-workflow-stage turnaround times
  const currentCountByStage = new Map<string, { stageType: string; count: number }>();
  for (const idea of ideas) {
    if (!idea.stageName || idea.status === "draft") continue;
    const entry = currentCountByStage.get(idea.stageName) ?? {
      stageType: idea.stageType ?? "evaluation",
      count: 0,
    };
    entry.count += 1;
    currentCountByStage.set(idea.stageName, entry);
  }

  const stageDurations = new Map<
    string,
    { stageType: string; hours: number[] }
  >();

  for (const events of historyByIdea.values()) {
    for (let i = 0; i < events.length; i += 1) {
      const current = events[i];
      const next = events[i + 1];
      const stageName = current.toStageName;
      if (!stageName) continue;

      const entry = stageDurations.get(stageName) ?? {
        stageType: current.toStageType ?? "evaluation",
        hours: [],
      };
      if (next) {
        const diffHours = Math.max(
          0,
          (next.createdAt.getTime() - current.createdAt.getTime()) /
            (1000 * 60 * 60),
        );
        entry.hours.push(Number(diffHours.toFixed(2)));
      }
      stageDurations.set(stageName, entry);
    }
  }

  const allStageNames = new Set([
    ...stageDurations.keys(),
    ...currentCountByStage.keys(),
  ]);

  const stageTurnarounds: StageTurnaroundMetric[] = [...allStageNames].map(
    (stageName) => {
      const dur = stageDurations.get(stageName);
      const cur = currentCountByStage.get(stageName);
      const samples = dur?.hours ?? [];
      const averageHours = samples.length
        ? Number(
            (samples.reduce((s, v) => s + v, 0) / samples.length).toFixed(1),
          )
        : null;
      return {
        stageName,
        stageType: dur?.stageType ?? cur?.stageType ?? "evaluation",
        transitions: samples.length,
        currentCount: cur?.count ?? 0,
        averageHours,
        medianHours: computeMedian(samples),
      };
    },
  );

  return {
    generatedAt: now.toISOString(),
    totals: {
      allSubmissions,
      drafts,
      submittedOrBeyond,
      inReview,
      changesRequested,
      approved,
      awarded,
      rejected,
      withdrawn,
    },
    byStatus,
    byCall,
    byCategory,
    demographics: {
      stakeholderTypes,
      organisationAffiliation,
      solutionMaturity,
      uniqueSubmitters,
      topOrganisations,
    },
    submissionTrend,
    stageFunnel,
    stageTurnarounds,
    evaluatorWorkload: [...input.evaluatorWorkload],
    chatAnalytics: input.chatAnalytics,
  };
}

export function escapeCsvCell(value: unknown): string {
  const raw = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replaceAll('"', '""')}"`;
  }
  return safe;
}

function csvRow(cells: unknown[]): string {
  return cells.map(escapeCsvCell).join(",");
}

export function buildExecutiveReportCsv(report: ExecutiveReportData): string {
  const lines: string[] = [];

  lines.push(csvRow(["CEDA Innovation Portal — Executive Analytics Report"]));
  lines.push(csvRow(["Generated At (UTC)", report.generatedAt]));
  lines.push("");

  lines.push(csvRow(["SECTION", "METRIC", "VALUE"]));
  lines.push(csvRow(["Overview", "All submissions (incl. drafts)", report.totals.allSubmissions]));
  lines.push(csvRow(["Overview", "Submitted ideas", report.totals.submittedOrBeyond]));
  lines.push(csvRow(["Overview", "Drafts", report.totals.drafts]));
  lines.push(csvRow(["Overview", "In review", report.totals.inReview]));
  lines.push(csvRow(["Overview", "Changes requested", report.totals.changesRequested]));
  lines.push(csvRow(["Overview", "Approved", report.totals.approved]));
  lines.push(csvRow(["Overview", "Awarded", report.totals.awarded]));
  lines.push(csvRow(["Overview", "Not selected", report.totals.rejected]));
  lines.push("");

  lines.push(csvRow(["SECTOR / CATEGORY PARTICIPATION", "SUBMISSIONS", "SHARE (%)"]));
  for (const row of report.byCategory) {
    lines.push(csvRow([row.category, row.count, `${row.sharePercent}%`]));
  }
  lines.push("");

  lines.push(csvRow(["APPLICANT DEMOGRAPHICS (UNIQUE SUBMITTERS)", "COUNT", "SHARE (%)"]));
  for (const row of report.demographics.stakeholderTypes) {
    lines.push(csvRow([row.name, row.count, `${row.sharePercent}%`]));
  }
  for (const row of report.demographics.organisationAffiliation) {
    lines.push(csvRow([row.name, row.count, `${row.sharePercent}%`]));
  }
  lines.push("");

  lines.push(csvRow(["PIPELINE FUNNEL STAGE", "IDEAS REACHED", "CONVERSION FROM PREV (%)", "OVERALL YIELD (%)"]));
  for (const row of report.stageFunnel) {
    lines.push(
      csvRow([
        row.label,
        row.count,
        row.conversionFromPreviousPercent !== null ? `${row.conversionFromPreviousPercent}%` : "—",
        row.conversionFromStartPercent !== null ? `${row.conversionFromStartPercent}%` : "—",
      ]),
    );
  }
  lines.push("");

  lines.push(csvRow(["WORKFLOW STAGE TURNAROUND", "CURRENT IDEAS", "COMPLETED TRANSITIONS", "AVG TURNAROUND", "MEDIAN TURNAROUND"]));
  for (const row of report.stageTurnarounds) {
    lines.push(
      csvRow([
        row.stageName,
        row.currentCount,
        row.transitions,
        formatTurnaroundHours(row.averageHours),
        formatTurnaroundHours(row.medianHours),
      ]),
    );
  }
  lines.push("");

  lines.push(csvRow(["INNOVATION CALL PARTICIPATION", "SUBMISSIONS"]));
  for (const row of report.byCall) {
    lines.push(csvRow([row.callTitle, row.count]));
  }
  lines.push("");

  lines.push(csvRow(["EVALUATOR WORKLOAD", "PENDING", "IN PROGRESS", "SUBMITTED", "DECLINED"]));
  for (const row of report.evaluatorWorkload) {
    lines.push(csvRow([row.evaluatorName, row.pending, row.inProgress, row.submitted, row.declined]));
  }
  lines.push("");

  lines.push(csvRow(["LIVE SUPPORT CHAT ANALYTICS", "VALUE"]));
  lines.push(csvRow(["Total conversations", report.chatAnalytics.totalConversations]));
  lines.push(csvRow(["Conversations (last 7 days)", report.chatAnalytics.conversationsLast7Days]));
  lines.push(csvRow(["Waiting in queue", report.chatAnalytics.waitingCount]));
  lines.push(csvRow(["Active chats", report.chatAnalytics.activeCount]));
  lines.push(csvRow(["Resolved chats", report.chatAnalytics.closedCount]));
  lines.push(csvRow(["Average first response", formatDurationSeconds(report.chatAnalytics.averageFirstResponseSeconds)]));
  lines.push(csvRow(["Resolution rate", report.chatAnalytics.resolutionRatePercent !== null ? `${report.chatAnalytics.resolutionRatePercent}%` : "—"]));
  lines.push(csvRow(["Average resolution time", formatDurationSeconds(report.chatAnalytics.averageResolutionSeconds)]));

  return lines.join("\r\n");
}
