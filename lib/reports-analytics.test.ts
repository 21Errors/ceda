import { describe, expect, it } from "vitest";
import {
  buildExecutiveReport,
  buildExecutiveReportCsv,
  escapeCsvCell,
  formatTurnaroundHours,
} from "./reports-analytics";
import type { ChatAnalyticsSummary } from "./chat-analytics-calc";

const emptyChatAnalytics: ChatAnalyticsSummary = {
  totalConversations: 4,
  waitingCount: 1,
  activeCount: 1,
  closedCount: 2,
  conversationsLast7Days: 3,
  totalMessages: 18,
  resolutionRatePercent: 50,
  averageFirstResponseSeconds: 180,
  medianFirstResponseSeconds: 150,
  averageResolutionSeconds: 900,
  consultantBreakdown: [],
};

describe("executive reporting analytics", () => {
  it("computes category participation, demographics, funnel conversion, and stage turnarounds", () => {
    const report = buildExecutiveReport({
      ideas: [
        {
          id: "i1",
          status: "awarded",
          callTitle: "Hackathon 2026",
          categoryName: "Digital Advancement",
          stageId: "st-award",
          stageName: "Award",
          stageType: "award",
          createdAt: new Date("2026-11-15T08:00:00Z"),
          submittedAt: new Date("2026-11-15T08:00:00Z"),
          submitterId: "u1",
          isInternal: false,
          organisation: "Kalahari Solar",
          jobTitle: "Founder",
          solutionStatus: "prototype",
        },
        {
          id: "i2",
          status: "in_review",
          callTitle: "Hackathon 2026",
          categoryName: "Enterprise Growth",
          stageId: "st-l1",
          stageName: "Level 1 Evaluation",
          stageType: "evaluation",
          createdAt: new Date("2026-11-16T08:00:00Z"),
          submittedAt: new Date("2026-11-16T08:00:00Z"),
          submitterId: "u2",
          isInternal: true,
          organisation: null,
          jobTitle: "Analyst",
          solutionStatus: "concept",
        },
        {
          id: "i3",
          status: "draft",
          callTitle: "Hackathon 2026",
          categoryName: null,
          stageId: null,
          stageName: null,
          stageType: null,
          createdAt: new Date("2026-11-17T08:00:00Z"),
          submittedAt: null,
          submitterId: "u3",
          isInternal: null,
          organisation: null,
          jobTitle: null,
          solutionStatus: null,
        },
      ],
      stageHistory: [
        {
          ideaId: "i1",
          fromStageId: null,
          toStageId: "st-sub",
          toStageName: "Submitted",
          toStageType: "intake",
          toStatus: "submitted",
          createdAt: new Date("2026-11-15T08:00:00Z"),
        },
        {
          ideaId: "i1",
          fromStageId: "st-sub",
          toStageId: "st-l1",
          toStageName: "Level 1 Evaluation",
          toStageType: "evaluation",
          toStatus: "in_review",
          createdAt: new Date("2026-11-15T14:00:00Z"), // 6h in Submitted
        },
        {
          ideaId: "i1",
          fromStageId: "st-l1",
          toStageId: "st-adj",
          toStageName: "Adjudication",
          toStageType: "adjudication",
          toStatus: "approved",
          createdAt: new Date("2026-11-16T14:00:00Z"), // 24h in Level 1
        },
        {
          ideaId: "i1",
          fromStageId: "st-adj",
          toStageId: "st-award",
          toStageName: "Award",
          toStageType: "award",
          toStatus: "awarded",
          createdAt: new Date("2026-11-17T14:00:00Z"), // 24h in Adjudication
        },
      ],
      evaluatorWorkload: [
        {
          evaluatorName: "Demo Evaluator",
          pending: 1,
          inProgress: 1,
          submitted: 2,
          declined: 0,
        },
      ],
      chatAnalytics: emptyChatAnalytics,
      now: new Date("2026-11-22T06:00:00Z"),
    });

    expect(report.totals.allSubmissions).toBe(3);
    expect(report.totals.submittedOrBeyond).toBe(2);
    expect(report.totals.awarded).toBe(1);

    expect(report.byCategory).toHaveLength(3);
    expect(report.demographics.uniqueSubmitters).toBe(3);
    expect(report.demographics.topOrganisations).toEqual([
      { name: "Kalahari Solar", count: 1 },
    ]);

    // Funnel: 2 submitted -> 2 review -> 1 feedback/adjudication -> 1 approved -> 1 awarded
    expect(report.stageFunnel.map((s) => s.count)).toEqual([2, 2, 1, 1, 1]);
    expect(report.stageFunnel[4]?.conversionFromStartPercent).toBe(50);

    const submittedTurnaround = report.stageTurnarounds.find(
      (s) => s.stageName === "Submitted",
    );
    expect(submittedTurnaround?.averageHours).toBe(6);

    const l1Turnaround = report.stageTurnarounds.find(
      (s) => s.stageName === "Level 1 Evaluation",
    );
    expect(l1Turnaround?.averageHours).toBe(24);
    expect(l1Turnaround?.currentCount).toBe(1);
  });

  it("formats turnaround hours and escapes CSV cells against formula injection", () => {
    expect(formatTurnaroundHours(null)).toBe("—");
    expect(formatTurnaroundHours(0.5)).toBe("30m");
    expect(formatTurnaroundHours(12.4)).toBe("12.4h");
    expect(formatTurnaroundHours(72)).toBe("3d");

    expect(escapeCsvCell("=CMD()")).toBe("'=CMD()");
    expect(escapeCsvCell('Hello, "CEDA"')).toBe('"Hello, ""CEDA"""');

    const report = buildExecutiveReport({
      ideas: [],
      stageHistory: [],
      evaluatorWorkload: [],
      chatAnalytics: emptyChatAnalytics,
      now: new Date("2026-11-22T06:00:00Z"),
    });
    const csv = buildExecutiveReportCsv(report);
    expect(csv).toContain("CEDA Innovation Portal");
    expect(csv).toContain("LIVE SUPPORT CHAT ANALYTICS");
    expect(csv).toContain("Resolution rate,50%");
  });
});
