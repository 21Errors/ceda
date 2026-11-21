import { describe, expect, it } from "vitest";
import { z } from "zod";
import { zodResolver } from "./zod-resolver";
import {
  alertSubscriptionSchema,
  createCallSchema,
  loginSchema,
  passwordChangeSchema,
} from "./form-schemas";

describe("zodResolver", () => {
  it("returns parsed values and empty errors for valid input", async () => {
    const resolver = zodResolver(loginSchema);
    const result = await resolver(
      { email: "  user@ceda.co.bw  ", password: "secret" },
      undefined,
      { fields: {}, shouldUseNativeValidation: false },
    );

    expect(result.errors).toEqual({});
    expect(result.values).toEqual({
      email: "user@ceda.co.bw",
      password: "secret",
    });
  });

  it("maps flat and nested field errors cleanly", async () => {
    const schema = z.object({
      title: z.string().min(5, "Too short"),
      answers: z.object({
        website: z.url("Invalid URL"),
      }),
    });
    const resolver = zodResolver(schema);
    const result = await resolver(
      { title: "Hi", answers: { website: "not-a-url" } },
      undefined,
      { fields: {}, shouldUseNativeValidation: false },
    );

    expect(result.values).toEqual({});
    expect(result.errors.title?.message).toBe("Too short");
    expect(result.errors.answers?.website?.message).toBe("Invalid URL");
  });

  it("validates cross-field refinements for password change and call dates", async () => {
    const pwResolver = zodResolver(passwordChangeSchema);
    const pwResult = await pwResolver(
      {
        currentPassword: "old-password",
        newPassword: "new-password-123",
        confirmPassword: "different-password",
      },
      undefined,
      { fields: {}, shouldUseNativeValidation: false },
    );
    expect(pwResult.errors.confirmPassword?.message).toBe(
      "The new passwords do not match.",
    );

    const callResolver = zodResolver(createCallSchema);
    const callResult = await callResolver(
      {
        title: "Youth Call 2027",
        slug: "youth-call-2027",
        description: "",
        status: "draft",
        opensAt: "2027-05-10T09:00",
        closesAt: "2027-05-01T09:00",
      },
      undefined,
      { fields: {}, shouldUseNativeValidation: false },
    );
    expect(callResult.errors.closesAt?.message).toBe(
      "Closing date must be later than the opening date.",
    );
  });

  it("accepts either email or Botswana phone in alert subscriptions", async () => {
    const resolver = zodResolver(alertSubscriptionSchema);
    const phoneOk = await resolver(
      { refNo: "CEDA-2026-0001", contact: "+267 71 234 567", channel: "both" },
      undefined,
      { fields: {}, shouldUseNativeValidation: false },
    );
    expect(phoneOk.errors).toEqual({});

    const bad = await resolver(
      { refNo: "BAD-REF", contact: "invalid", channel: "email" },
      undefined,
      { fields: {}, shouldUseNativeValidation: false },
    );
    expect(bad.errors.refNo?.message).toBeTruthy();
    expect(bad.errors.contact?.message).toBeTruthy();
  });
});
