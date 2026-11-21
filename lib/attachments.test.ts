import { describe, expect, it } from "vitest";
import {
  MAX_ATTACHMENT_BYTES,
  formatFileSize,
  getAttachmentDownloadPath,
  getAttachmentTypeLabel,
  sanitizeFileName,
  validateAttachmentMetadata,
} from "@/lib/attachments";

describe("attachment metadata validation and sanitization", () => {
  it("sanitizes path traversal, null bytes, spaces, and unsafe characters", () => {
    expect(sanitizeFileName("../../etc/passwd.pdf")).toBe("passwd.pdf");
    expect(sanitizeFileName("C:\\Users\\demo\\My Pitch Deck (Final)!.pptx")).toBe("My-Pitch-Deck-Final.pptx");
    expect(sanitizeFileName("report\0.pdf")).toBe("report.pdf");
    expect(sanitizeFileName("   .pdf")).toBe("attachment");
  });

  it("accepts allowed pitch deck, document, spreadsheet, and image formats", () => {
    const validCases = [
      { fileName: "pitch-deck.pdf", fileSize: 1024, mimeType: "application/pdf" },
      {
        fileName: "slides.pptx",
        fileSize: 2048,
        mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      },
      { fileName: "slides.pptx", fileSize: 2048, mimeType: "" }, // Windows empty MIME fallback
      { fileName: "slides.pptx", fileSize: 2048, mimeType: "application/octet-stream" },
      { fileName: "mockup.png", fileSize: 512, mimeType: "image/png" },
      { fileName: "prototype.webp", fileSize: 512, mimeType: "image/webp" },
    ];

    for (const input of validCases) {
      expect(validateAttachmentMetadata(input).ok).toBe(true);
    }
  });

  it("rejects executable, scriptable, mismatched, empty, and oversized files", () => {
    expect(validateAttachmentMetadata({ fileName: "xss.html", fileSize: 100, mimeType: "text/html" }).ok).toBe(false);
    expect(validateAttachmentMetadata({ fileName: "vector.svg", fileSize: 100, mimeType: "image/svg+xml" }).ok).toBe(false);
    expect(validateAttachmentMetadata({ fileName: "payload.exe", fileSize: 100, mimeType: "application/octet-stream" }).ok).toBe(false);
    expect(validateAttachmentMetadata({ fileName: "spoof.pdf", fileSize: 100, mimeType: "image/png" }).ok).toBe(false);
    expect(validateAttachmentMetadata({ fileName: "empty.pdf", fileSize: 0, mimeType: "application/pdf" }).ok).toBe(false);
    expect(
      validateAttachmentMetadata({
        fileName: "huge.pdf",
        fileSize: MAX_ATTACHMENT_BYTES + 1,
        mimeType: "application/pdf",
      }).ok,
    ).toBe(false);
  });

  it("formats sizes, type labels, and download paths cleanly", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2.00 MB");
    expect(getAttachmentTypeLabel("application/pdf")).toBe("PDF");
    expect(getAttachmentTypeLabel(null, "deck.pptx")).toBe("PowerPoint");
    expect(getAttachmentDownloadPath("abc-123")).toBe("/api/attachments/abc-123");
  });
});
