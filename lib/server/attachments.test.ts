import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  buildAttachmentStorageKey,
  buildContentDisposition,
  evaluateAttachmentAccess,
  signStagedAttachmentToken,
  validateAndInspectAttachmentFile,
  verifyFileSignature,
  verifyStagedAttachmentToken,
} from "@/lib/server/attachments";

describe("server attachment security controls", () => {
  it("verifies magic-byte signatures and rejects spoofed payloads", () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const webpBytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    const ooxmlBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
    const ole2Bytes = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    const htmlSpoof = new TextEncoder().encode("<html><script>alert(1)</script></html>");

    expect(verifyFileSignature(pdfBytes, "application/pdf")).toBe(true);
    expect(verifyFileSignature(pngBytes, "image/png")).toBe(true);
    expect(verifyFileSignature(jpegBytes, "image/jpeg")).toBe(true);
    expect(verifyFileSignature(webpBytes, "image/webp")).toBe(true);
    expect(
      verifyFileSignature(
        ooxmlBytes,
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ),
    ).toBe(true);
    expect(verifyFileSignature(ole2Bytes, "application/msword")).toBe(true);
    expect(verifyFileSignature(htmlSpoof, "application/pdf")).toBe(false);
    expect(verifyFileSignature(htmlSpoof, "image/png")).toBe(false);
  });

  it("inspects uploaded File instances and blocks disguised scripts", async () => {
    const validPdf = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37])], "deck.pdf", {
      type: "application/pdf",
    });
    const inspectedValid = await validateAndInspectAttachmentFile(validPdf);
    expect(inspectedValid.ok).toBe(true);

    const fakePdf = new File([new TextEncoder().encode("<script>alert(1)</script>")], "deck.pdf", {
      type: "application/pdf",
    });
    const inspectedFake = await validateAndInspectAttachmentFile(fakePdf);
    expect(inspectedFake.ok).toBe(false);
  });

  it("builds scoped storage keys and injection-safe Content-Disposition headers", () => {
    const key = buildAttachmentStorageKey("idea-123", "ver-456", "../../Pitch Deck (v2).pdf");
    expect(key).toMatch(/^ideas\/idea-123\/ver-456\/[\da-f-]+-Pitch-Deck-v2\.pdf$/i);

    const header = buildContentDisposition('evil"\r\nX-Injected: 1.pdf');
    expect(header).not.toContain("\r");
    expect(header).not.toContain("\n");
    expect(header).toMatch(/^attachment; filename="[^"]+"; filename\*=UTF-8''/);
  });

  it("signs, verifies, and rejects tampered or expired staged attachment tokens", () => {
    const payload = {
      storageKey: "ideas/idea-1/resubmission/user-1/abc-deck.pdf",
      fileName: "deck.pdf",
      fileSize: 1024,
      mimeType: "application/pdf",
      ideaId: "idea-1",
      userId: "user-1",
    };

    const token = signStagedAttachmentToken(payload, 300);
    const verified = verifyStagedAttachmentToken(token);
    expect(verified).toMatchObject(payload);

    // Tampered token fails verification
    const tampered = `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`;
    expect(verifyStagedAttachmentToken(tampered)).toBeNull();

    // Expired token fails verification
    const expired = signStagedAttachmentToken(payload, -10);
    expect(verifyStagedAttachmentToken(expired)).toBeNull();
  });

  it("enforces strict RBAC for attachment downloads", () => {
    const draftIdea = { id: "idea-1", submitterId: "owner-1", status: "draft" };
    const submittedIdea = { id: "idea-1", submitterId: "owner-1", status: "in_review" };

    // Owner can access drafts and submitted ideas
    expect(
      evaluateAttachmentAccess({
        userId: "owner-1",
        roles: ["submitter"],
        idea: draftIdea,
        isCollaborator: false,
        isAssignedEvaluator: false,
      }),
    ).toBe(true);

    // Unrelated submitter cannot access
    expect(
      evaluateAttachmentAccess({
        userId: "other-user",
        roles: ["submitter"],
        idea: submittedIdea,
        isCollaborator: false,
        isAssignedEvaluator: false,
      }),
    ).toBe(false);

    // Adjudicator and committee can access submitted ideas, not drafts
    expect(
      evaluateAttachmentAccess({
        userId: "adj-1",
        roles: ["adjudicator"],
        idea: draftIdea,
        isCollaborator: false,
        isAssignedEvaluator: false,
      }),
    ).toBe(false);
    expect(
      evaluateAttachmentAccess({
        userId: "adj-1",
        roles: ["adjudicator"],
        idea: submittedIdea,
        isCollaborator: false,
        isAssignedEvaluator: false,
      }),
    ).toBe(true);
    expect(
      evaluateAttachmentAccess({
        userId: "comm-1",
        roles: ["committee_member"],
        idea: submittedIdea,
        isCollaborator: false,
        isAssignedEvaluator: false,
      }),
    ).toBe(true);

    // Evaluator must be assigned and idea must not be a draft
    expect(
      evaluateAttachmentAccess({
        userId: "eval-1",
        roles: ["evaluator"],
        idea: submittedIdea,
        isCollaborator: false,
        isAssignedEvaluator: false,
      }),
    ).toBe(false);
    expect(
      evaluateAttachmentAccess({
        userId: "eval-1",
        roles: ["evaluator"],
        idea: submittedIdea,
        isCollaborator: false,
        isAssignedEvaluator: true,
      }),
    ).toBe(true);

    // Admin has full access
    expect(
      evaluateAttachmentAccess({
        userId: "admin-1",
        roles: ["admin"],
        idea: draftIdea,
        isCollaborator: false,
        isAssignedEvaluator: false,
      }),
    ).toBe(true);
  });
});
