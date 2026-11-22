import { describe, expect, it } from "vitest";
import {
  evaluateDeskAvailability,
  getBotswanaHolidayName,
} from "./chat-availability";

describe("chat availability & Botswana public holidays", () => {
  it("recognizes fixed and movable Botswana public holidays", () => {
    expect(getBotswanaHolidayName("2026-09-30")).toBe("Botswana Day");
    expect(getBotswanaHolidayName("2026-07-01")).toBe("Sir Seretse Khama Day");
    expect(getBotswanaHolidayName("2026-04-03")).toBe("Good Friday");
    expect(getBotswanaHolidayName("2026-04-06")).toBe("Easter Monday");
    expect(getBotswanaHolidayName("2026-07-20")).toBe("President's Day");
    expect(getBotswanaHolidayName("2026-07-21")).toBe("President's Day Holiday");
    expect(getBotswanaHolidayName("2026-11-18")).toBeNull();
  });

  it("supports custom extra holidays from system settings", () => {
    const extra = new Map([["2026-11-20", "Special CEDA Day"]]);
    expect(getBotswanaHolidayName("2026-11-20", extra)).toBe("Special CEDA Day");
  });

  it("marks desk as public_holiday on Botswana Day even during weekday business hours", () => {
    // 2026-09-30 10:00 CAT = 08:00 UTC (Wednesday)
    const result = evaluateDeskAvailability({
      now: new Date("2026-09-30T08:00:00Z"),
      totalConsultants: 2,
      activeByConsultant: new Map(),
      waitingCount: 0,
    });
    expect(result.status).toBe("public_holiday");
    expect(result.isOpen).toBe(false);
    expect(result.holidayName).toBe("Botswana Day");
    expect(result.bannerMessage).toContain("Botswana Day");
  });

  it("marks desk as offline_hours on weekends and outside 09:00-16:00 CAT", () => {
    // 2026-11-22 is Sunday
    const sunday = evaluateDeskAvailability({
      now: new Date("2026-11-22T09:00:00Z"),
      totalConsultants: 2,
      activeByConsultant: new Map(),
      waitingCount: 1,
    });
    expect(sunday.status).toBe("offline_hours");
    expect(sunday.isOpen).toBe(false);

    // 2026-11-18 Wednesday at 17:00 CAT (15:00 UTC)
    const afterHours = evaluateDeskAvailability({
      now: new Date("2026-11-18T15:00:00Z"),
      totalConsultants: 2,
      activeByConsultant: new Map(),
      waitingCount: 0,
    });
    expect(afterHours.status).toBe("offline_hours");
  });

  it("triggers automated all-agents-busy fallback when all consultants are at capacity during office hours", () => {
    // 2026-11-18 Wednesday 11:00 CAT (09:00 UTC)
    const result = evaluateDeskAvailability({
      now: new Date("2026-11-18T09:00:00Z"),
      totalConsultants: 2,
      activeByConsultant: new Map([
        ["agent-1", 3],
        ["agent-2", 4],
      ]),
      waitingCount: 2,
      maxConcurrentPerAgent: 3,
    });
    expect(result.status).toBe("busy");
    expect(result.isOpen).toBe(true);
    expect(result.allAgentsBusy).toBe(true);
    expect(result.availableConsultants).toBe(0);
    expect(result.bannerMessage).toContain("All CEDA service consultants");
    expect(result.bannerMessage).toContain("2 applicants");
  });

  it("reports open and available capacity when at least one consultant has slots", () => {
    const result = evaluateDeskAvailability({
      now: new Date("2026-11-18T09:00:00Z"),
      totalConsultants: 2,
      activeByConsultant: new Map([["agent-1", 3]]),
      waitingCount: 0,
      maxConcurrentPerAgent: 3,
    });
    expect(result.status).toBe("open");
    expect(result.isOpen).toBe(true);
    expect(result.allAgentsBusy).toBe(false);
    expect(result.availableConsultants).toBe(1);
    expect(result.bannerMessage).toBeNull();
  });
});
