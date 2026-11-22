"use client";

import {
  CheckCircle2,
  Clock3,
  MessageSquare,
  RefreshCw,
  Users,
} from "lucide-react";
import type { ChatAnalyticsSummary } from "@/lib/chat-analytics-calc";
import { formatDurationSeconds } from "@/lib/chat-analytics-calc";
import type { DeskAvailability } from "@/lib/chat-availability";

interface ChatDeskStatsProps {
  availability: DeskAvailability;
  analytics: ChatAnalyticsSummary;
  myActiveCount: number;
  refreshing: boolean;
  onRefresh: () => void;
}

export function ChatDeskStats({
  availability,
  analytics,
  myActiveCount,
  refreshing,
  onRefresh,
}: ChatDeskStatsProps) {
  const deskStatusLabel =
    availability.status === "public_holiday"
      ? `Public holiday (${availability.holidayName})`
      : availability.status === "offline_hours"
        ? "Offline (09:00–16:00 CAT)"
        : availability.status === "busy"
          ? "All agents at capacity"
          : "Desk open & accepting chats";

  const deskStatusTone =
    availability.status === "open"
      ? "border-emerald-700/25 bg-emerald-50 text-emerald-900"
      : availability.status === "busy"
        ? "border-amber-600/30 bg-amber-50 text-amber-950"
        : "border-ceda-line bg-[#FFF9F4] text-ceda-burgundy";

  return (
    <section aria-label="Service desk status and chat analytics">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${deskStatusTone}`}
        >
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${
              availability.status === "open"
                ? "bg-emerald-600"
                : availability.status === "busy"
                  ? "bg-amber-600"
                  : "bg-ceda-burgundy"
            }`}
          />
          {deskStatusLabel} · Your active load: {myActiveCount} /{" "}
          {availability.maxConcurrentPerAgent}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ceda-line bg-white px-4 text-xs font-semibold text-ceda-burgundy hover:bg-[#FFF9F4] disabled:opacity-60"
        >
          <RefreshCw
            aria-hidden="true"
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh queue
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-ceda-line bg-[#FFFDFC] p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ceda-muted">
            <MessageSquare aria-hidden="true" className="h-3.5 w-3.5 text-ceda-burgundy" />
            Total chats (7d)
          </p>
          <p className="mt-1.5 text-2xl font-bold text-ceda-ink">
            {analytics.totalConversations}
            <span className="ml-2 text-xs font-normal text-ceda-muted">
              ({analytics.conversationsLast7Days} last 7d)
            </span>
          </p>
        </article>

        <article className="rounded-2xl border border-ceda-line bg-[#FFFDFC] p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ceda-muted">
            <Users aria-hidden="true" className="h-3.5 w-3.5 text-ceda-burgundy" />
            Queue &amp; active
          </p>
          <p className="mt-1.5 text-2xl font-bold text-ceda-ink">
            {analytics.waitingCount} waiting
            <span className="ml-2 text-xs font-normal text-ceda-muted">
              · {analytics.activeCount} active
            </span>
          </p>
        </article>

        <article className="rounded-2xl border border-ceda-line bg-[#FFFDFC] p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ceda-muted">
            <Clock3 aria-hidden="true" className="h-3.5 w-3.5 text-ceda-burgundy" />
            Avg first response
          </p>
          <p className="mt-1.5 text-2xl font-bold text-ceda-ink">
            {formatDurationSeconds(analytics.averageFirstResponseSeconds)}
            <span className="ml-2 text-xs font-normal text-ceda-muted">
              (median {formatDurationSeconds(analytics.medianFirstResponseSeconds)})
            </span>
          </p>
        </article>

        <article className="rounded-2xl border border-ceda-line bg-[#FFFDFC] p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ceda-muted">
            <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-ceda-burgundy" />
            Resolution rate
          </p>
          <p className="mt-1.5 text-2xl font-bold text-ceda-ink">
            {analytics.resolutionRatePercent !== null
              ? `${analytics.resolutionRatePercent}%`
              : "—"}
            <span className="ml-2 text-xs font-normal text-ceda-muted">
              · avg {formatDurationSeconds(analytics.averageResolutionSeconds)}
            </span>
          </p>
        </article>
      </div>
    </section>
  );
}
