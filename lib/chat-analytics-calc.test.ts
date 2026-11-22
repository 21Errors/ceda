import { describe, expect, it } from "vitest";
import {
  computeChatAnalytics,
  formatDurationSeconds,
} from "./chat-analytics-calc";

describe("chat analytics calculations", () => {
  it("handles empty dataset gracefully", () => {
    const result = computeChatAnalytics([]);
    expect(result.totalConversations).toBe(0);
    expect(result.resolutionRatePercent).toBeNull();
    expect(result.averageFirstResponseSeconds).toBeNull();
    expect(result.averageResolutionSeconds).toBeNull();
    expect(result.consultantBreakdown).toEqual([]);
  });

  it("computes volume, response time, resolution rate, and consultant breakdown", () => {
    const now = new Date("2026-11-22T10:00:00Z");
    const result = computeChatAnalytics(
      [
        {
          id: "c1",
          requesterId: "u1",
          agentId: "a1",
          agentName: "Lerato",
          status: "closed",
          startedAt: new Date("2026-11-21T09:00:00Z"),
          firstConsultantReplyAt: new Date("2026-11-21T09:02:00Z"), // 120s
          closedAt: new Date("2026-11-21T09:12:00Z"), // 720s
          messageCount: 6,
        },
        {
          id: "c2",
          requesterId: "u2",
          agentId: "a1",
          agentName: "Lerato",
          status: "active",
          startedAt: new Date("2026-11-22T09:00:00Z"),
          firstConsultantReplyAt: new Date("2026-11-22T09:04:00Z"), // 240s
          closedAt: null,
          messageCount: 3,
        },
        {
          id: "c3",
          requesterId: "u3",
          agentId: null,
          agentName: null,
          status: "waiting",
          startedAt: new Date("2026-11-10T09:00:00Z"), // older than 7d
          firstConsultantReplyAt: null,
          closedAt: null,
          messageCount: 1,
        },
      ],
      now,
    );

    expect(result.totalConversations).toBe(3);
    expect(result.waitingCount).toBe(1);
    expect(result.activeCount).toBe(1);
    expect(result.closedCount).toBe(1);
    expect(result.conversationsLast7Days).toBe(2);
    expect(result.totalMessages).toBe(10);
    expect(result.resolutionRatePercent).toBe(33);
    expect(result.averageFirstResponseSeconds).toBe(180);
    expect(result.medianFirstResponseSeconds).toBe(180);
    expect(result.averageResolutionSeconds).toBe(720);
    expect(result.consultantBreakdown).toEqual([
      {
        agentId: "a1",
        agentName: "Lerato",
        activeChats: 1,
        resolvedChats: 1,
        averageFirstResponseSeconds: 180,
      },
    ]);
  });

  it("formats durations cleanly", () => {
    expect(formatDurationSeconds(null)).toBe("—");
    expect(formatDurationSeconds(45)).toBe("45s");
    expect(formatDurationSeconds(180)).toBe("3m");
    expect(formatDurationSeconds(5400)).toBe("1h 30m");
    expect(formatDurationSeconds(7200)).toBe("2h");
  });
});
