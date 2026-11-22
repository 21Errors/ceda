import { describe, expect, it } from "vitest";
import {
  getTrackingNextStep,
  isValidReferenceFormat,
  mapIdeaToPipelineStage,
  normalizeReferenceInput,
} from "./track-pipeline";

describe("track pipeline helpers", () => {
  it("normalizes whitespace and casing on reference inputs", () => {
    expect(normalizeReferenceInput("  ceda-2026-a1b2 c3d4  ")).toBe(
      "CEDA-2026-A1B2C3D4",
    );
    expect(normalizeReferenceInput("ceda-2026-0001")).toBe("CEDA-2026-0001");
  });

  it("validates standard CEDA reference formats", () => {
    expect(isValidReferenceFormat("CEDA-2026-A1B2C3D4")).toBe(true);
    expect(isValidReferenceFormat("ceda-2026-0001")).toBe(true);
    expect(isValidReferenceFormat("INVALID-123")).toBe(false);
    expect(isValidReferenceFormat("CEDA-26-1234")).toBe(false);
    expect(isValidReferenceFormat("")).toBe(false);
  });

  it("maps statuses and workflow stage types to the 5-stage pipeline", () => {
    expect(mapIdeaToPipelineStage("draft", "intake")).toEqual({
      currentStage: "submission",
      changesRequested: false,
      isRejected: false,
      isWithdrawn: false,
    });

    expect(mapIdeaToPipelineStage("submitted", "intake")).toEqual({
      currentStage: "submission",
      changesRequested: false,
      isRejected: false,
      isWithdrawn: false,
    });

    expect(mapIdeaToPipelineStage("in_review", "evaluation")).toEqual({
      currentStage: "review",
      changesRequested: false,
      isRejected: false,
      isWithdrawn: false,
    });

    expect(mapIdeaToPipelineStage("in_review", "adjudication")).toEqual({
      currentStage: "approval",
      changesRequested: false,
      isRejected: false,
      isWithdrawn: false,
    });

    expect(mapIdeaToPipelineStage("changes_requested", "feedback")).toEqual({
      currentStage: "feedback",
      changesRequested: true,
      isRejected: false,
      isWithdrawn: false,
    });

    expect(mapIdeaToPipelineStage("approved", "decision")).toEqual({
      currentStage: "approval",
      changesRequested: false,
      isRejected: false,
      isWithdrawn: false,
    });

    expect(mapIdeaToPipelineStage("rejected", "decision")).toEqual({
      currentStage: "approval",
      changesRequested: false,
      isRejected: true,
      isWithdrawn: false,
    });

    expect(mapIdeaToPipelineStage("awarded", "award")).toEqual({
      currentStage: "award",
      changesRequested: false,
      isRejected: false,
      isWithdrawn: false,
    });

    expect(mapIdeaToPipelineStage("withdrawn", "intake")).toEqual({
      currentStage: "submission",
      changesRequested: false,
      isRejected: false,
      isWithdrawn: true,
    });
  });

  it("returns helpful next-step messages for key statuses", () => {
    expect(getTrackingNextStep("in_review", "Level 1 Evaluation")).toContain(
      "Level 1 Evaluation",
    );
    expect(getTrackingNextStep("changes_requested")).toContain("Action required");
    expect(getTrackingNextStep("awarded")).toContain("award recognition");
  });
});
