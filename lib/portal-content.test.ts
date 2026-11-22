import { describe, expect, it } from "vitest";
import {
  getContentBlockSection,
  getPublishedNewsAnnouncements,
  isValidContentBlockKey,
  resolveGuidelinesBlocks,
  slugifyAnnouncementKey,
} from "./portal-content";

describe("portal content helpers", () => {
  it("validates content block keys strictly", () => {
    expect(isValidContentBlockKey("guidelines.overview")).toBe(true);
    expect(isValidContentBlockKey("news.hackathon-2026")).toBe(true);
    expect(isValidContentBlockKey("INVALID KEY")).toBe(false);
    expect(isValidContentBlockKey(".bad")).toBe(false);
    expect(isValidContentBlockKey("a")).toBe(false);
  });

  it("slugifies announcement titles into news.<slug> keys", () => {
    expect(slugifyAnnouncementKey("Q4 Innovation Call Extended!")).toBe(
      "news.q4-innovation-call-extended",
    );
    expect(slugifyAnnouncementKey("   ")).toBe("news.announcement");
  });

  it("classifies content block sections", () => {
    expect(getContentBlockSection("guidelines.overview")).toBe("guidelines");
    expect(getContentBlockSection("news.banner")).toBe("news");
    expect(getContentBlockSection("home.notice")).toBe("portal");
  });

  it("merges guidelines defaults with DB overrides, hides unpublished slots, and appends custom guidelines", () => {
    const resolved = resolveGuidelinesBlocks([
      {
        key: "guidelines.overview",
        title: "Custom Overview Title",
        body: "Custom overview body",
        isPublished: true,
        updatedAt: new Date("2026-11-20T10:00:00Z"),
      },
      {
        key: "guidelines.eligibility",
        title: "Hidden",
        body: "Hidden body",
        isPublished: false,
      },
      {
        key: "guidelines.ip_policy",
        title: "Intellectual Property",
        body: "Applicants retain ownership of their IP.",
        isPublished: true,
      },
    ]);

    expect(resolved.map((item) => item.key)).toEqual([
      "guidelines.overview",
      "guidelines.submission_steps",
      "guidelines.evaluation_process",
      "guidelines.ip_policy",
    ]);
    expect(resolved[0]?.title).toBe("Custom Overview Title");
    expect(resolved[3]?.title).toBe("Intellectual Property");
  });

  it("orders news.banner first and sorts other published announcements newest-first", () => {
    const items = getPublishedNewsAnnouncements([
      {
        key: "news.older",
        title: "Older",
        body: "Body 1",
        isPublished: true,
        updatedAt: new Date("2026-11-10T10:00:00Z"),
      },
      {
        key: "news.draft",
        title: "Draft",
        body: "Draft body",
        isPublished: false,
        updatedAt: new Date("2026-11-22T10:00:00Z"),
      },
      {
        key: "news.newer",
        title: "Newer",
        body: "Body 2",
        isPublished: true,
        updatedAt: new Date("2026-11-21T10:00:00Z"),
      },
      {
        key: "news.banner",
        title: "Pinned Banner",
        body: "Banner body",
        isPublished: true,
        updatedAt: new Date("2026-11-01T10:00:00Z"),
      },
    ]);

    expect(items.map((item) => item.key)).toEqual([
      "news.banner",
      "news.newer",
      "news.older",
    ]);
  });
});
