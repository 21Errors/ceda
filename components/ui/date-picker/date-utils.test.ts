import { describe, expect, it } from "vitest";
import {
  buildMonthGrid,
  formatDateValue,
  formatDisplayDate,
  parseDateValue,
} from "./date-utils";

describe("date-picker utilities", () => {
  it("parses and formats date-only and datetime values without timezone drift", () => {
    const parsed = parseDateValue("2027-03-15T08:30", true);
    expect(parsed).toEqual({
      year: 2027,
      month: 2,
      day: 15,
      hour: 8,
      minute: 30,
    });
    expect(formatDateValue(parsed!, true)).toBe("2027-03-15T08:30");
    expect(formatDateValue(parsed!, false)).toBe("2027-03-15");
    expect(formatDisplayDate("2027-03-15T08:30", true)).toBe("15 Mar 2027, 08:30");
    expect(formatDisplayDate("2027-03-15", false)).toBe("15 Mar 2027");
  });

  it("rejects impossible calendar dates such as Feb 30", () => {
    expect(parseDateValue("2027-02-30", false)).toBeNull();
    expect(parseDateValue("2027-13-01", false)).toBeNull();
  });

  it("builds a complete 42-cell month grid", () => {
    const grid = buildMonthGrid(2026, 10); // November 2026
    expect(grid).toHaveLength(42);
    expect(grid.filter((cell) => cell.inCurrentMonth)).toHaveLength(30);
    expect(grid[0]?.isoDate).toBe("2026-11-01");
  });
});
