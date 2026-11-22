export interface ChatConversationMetricRow {
  id: string;
  requesterId: string;
  agentId: string | null;
  agentName: string | null;
  status: "waiting" | "active" | "closed";
  startedAt: Date;
  closedAt: Date | null;
  firstConsultantReplyAt: Date | null;
  messageCount: number;
}

export interface ConsultantMetricSummary {
  agentId: string;
  agentName: string;
  activeChats: number;
  resolvedChats: number;
  averageFirstResponseSeconds: number | null;
}

export interface ChatAnalyticsSummary {
  totalConversations: number;
  waitingCount: number;
  activeCount: number;
  closedCount: number;
  conversationsLast7Days: number;
  totalMessages: number;
  resolutionRatePercent: number | null;
  averageFirstResponseSeconds: number | null;
  medianFirstResponseSeconds: number | null;
  averageResolutionSeconds: number | null;
  consultantBreakdown: ConsultantMetricSummary[];
}

function computeMedian(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function computeChatAnalytics(
  rows: readonly ChatConversationMetricRow[],
  now: Date = new Date(),
): ChatAnalyticsSummary {
  const sevenDaysAgoMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  let waitingCount = 0;
  let activeCount = 0;
  let closedCount = 0;
  let conversationsLast7Days = 0;
  let totalMessages = 0;

  const firstResponseSeconds: number[] = [];
  const resolutionSeconds: number[] = [];

  const byConsultant = new Map<
    string,
    {
      agentId: string;
      agentName: string;
      activeChats: number;
      resolvedChats: number;
      responseSamples: number[];
    }
  >();

  for (const row of rows) {
    if (row.status === "waiting") waitingCount += 1;
    else if (row.status === "active") activeCount += 1;
    else if (row.status === "closed") closedCount += 1;

    if (row.startedAt.getTime() >= sevenDaysAgoMs) {
      conversationsLast7Days += 1;
    }

    totalMessages += row.messageCount;

    let responseSec: number | null = null;
    if (row.firstConsultantReplyAt) {
      const diffSec = Math.max(
        0,
        Math.round(
          (row.firstConsultantReplyAt.getTime() - row.startedAt.getTime()) /
            1000,
        ),
      );
      firstResponseSeconds.push(diffSec);
      responseSec = diffSec;
    }

    if (row.status === "closed" && row.closedAt) {
      const diffSec = Math.max(
        0,
        Math.round((row.closedAt.getTime() - row.startedAt.getTime()) / 1000),
      );
      resolutionSeconds.push(diffSec);
    }

    if (row.agentId) {
      const entry = byConsultant.get(row.agentId) ?? {
        agentId: row.agentId,
        agentName: row.agentName ?? "CEDA Consultant",
        activeChats: 0,
        resolvedChats: 0,
        responseSamples: [],
      };
      if (row.status === "active") entry.activeChats += 1;
      if (row.status === "closed") entry.resolvedChats += 1;
      if (responseSec !== null) entry.responseSamples.push(responseSec);
      byConsultant.set(row.agentId, entry);
    }
  }

  const totalConversations = rows.length;
  const resolutionRatePercent =
    totalConversations > 0
      ? Math.round((closedCount / totalConversations) * 100)
      : null;

  const averageFirstResponseSeconds = firstResponseSeconds.length
    ? Math.round(
        firstResponseSeconds.reduce((sum, val) => sum + val, 0) /
          firstResponseSeconds.length,
      )
    : null;

  const medianFirstResponseSeconds = computeMedian(firstResponseSeconds);

  const averageResolutionSeconds = resolutionSeconds.length
    ? Math.round(
        resolutionSeconds.reduce((sum, val) => sum + val, 0) /
          resolutionSeconds.length,
      )
    : null;

  const consultantBreakdown: ConsultantMetricSummary[] = [
    ...byConsultant.values(),
  ]
    .map((entry) => ({
      agentId: entry.agentId,
      agentName: entry.agentName,
      activeChats: entry.activeChats,
      resolvedChats: entry.resolvedChats,
      averageFirstResponseSeconds: entry.responseSamples.length
        ? Math.round(
            entry.responseSamples.reduce((sum, val) => sum + val, 0) /
              entry.responseSamples.length,
          )
        : null,
    }))
    .sort((a, b) => a.agentName.localeCompare(b.agentName));

  return {
    totalConversations,
    waitingCount,
    activeCount,
    closedCount,
    conversationsLast7Days,
    totalMessages,
    resolutionRatePercent,
    averageFirstResponseSeconds,
    medianFirstResponseSeconds,
    averageResolutionSeconds,
    consultantBreakdown,
  };
}

export function formatDurationSeconds(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s`;
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
