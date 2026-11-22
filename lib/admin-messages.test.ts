import { describe, expect, it } from "vitest";
import {
  resolveCallConfigError,
  resolveCallConfigStep,
  resolveDocumentsAdminFeedback,
  resolveNewCallError,
} from "./admin-messages";

describe("admin message resolvers", () => {
  it("routes call config errors to the matching wizard step", () => {
    expect(resolveCallConfigStep({ error: "stage_duplicate" })).toBe("stages");
    expect(resolveCallConfigStep({ error: "criterion_locked" })).toBe("criteria");
    expect(resolveCallConfigStep({ error: "status" })).toBe("publish");
    expect(resolveCallConfigStep({ step: "criteria", error: "stage" })).toBe(
      "criteria",
    );
  });

  it("maps call configuration and new call error codes cleanly", () => {
    expect(resolveNewCallError({ error: "duplicate" })).toContain("already used");
    expect(resolveCallConfigError({ error: "options" })).toContain("commas");
    expect(resolveCallConfigError({})).toBe("");
  });

  it("returns document notice and custom upload detail", () => {
    expect(
      resolveDocumentsAdminFeedback({
        error: "upload",
        detail: "File exceeds 10 MB.",
      }),
    ).toEqual({
      notice: "",
      errorMessage: "File exceeds 10 MB.",
    });
  });
});
