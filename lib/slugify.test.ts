import { describe, expect, it } from "vitest";
import {
  sanitizeFieldKeyInput,
  sanitizeSlugInput,
  toFieldKey,
  toUrlSlug,
} from "./slugify";

describe("slugify helpers", () => {
  it("turns call titles with spaces, punctuation, and accents into clean URL slugs", () => {
    expect(toUrlSlug("Youth Innovation & Agritech Challenge 2027!")).toBe(
      "youth-innovation-and-agritech-challenge-2027",
    );
    expect(toUrlSlug("  Café   Entrepreneurs'   Fund  ")).toBe(
      "cafe-entrepreneurs-fund",
    );
  });

  it("caps slug length without leaving trailing hyphens", () => {
    const slug = toUrlSlug("a".repeat(119) + " extra words", 120);
    expect(slug.length).toBeLessThanOrEqual(120);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("replaces spaces with hyphens while typing without stripping trailing hyphen mid-word", () => {
    expect(sanitizeSlugInput("Youth Innovation ")).toBe("youth-innovation-");
    expect(sanitizeSlugInput("youth---2027!!")).toBe("youth-2027");
  });

  it("generates and sanitizes valid snake_case field keys", () => {
    expect(toFieldKey("Projected Revenue (BWP)")).toBe("projected_revenue_bwp");
    expect(toFieldKey("2027 Target Market")).toBe("target_market");
    expect(sanitizeFieldKeyInput("Target Market ")).toBe("target_market_");
  });
});
