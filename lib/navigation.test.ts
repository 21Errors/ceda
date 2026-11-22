import { describe, expect, it } from "vitest";
import {
  buildWorkspaceBreadcrumbs,
  getNavigationForRoles,
  getPrimaryWorkspaceHref,
  isNavItemActive,
} from "./navigation";

describe("RBAC workspace navigation", () => {
  it("shows only submitter and account links for a submitter", () => {
    const groups = getNavigationForRoles(["submitter"]);
    const groupIds = groups.map((group) => group.id);
    const hrefs = groups.flatMap((group) => group.items.map((item) => item.href));

    expect(groupIds).toEqual(["submitter", "account"]);
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/submit");
    expect(hrefs).toContain("/track");
    expect(hrefs).toContain("/profile");
    expect(hrefs).toContain("/account/settings");
    expect(hrefs).not.toContain("/notifications");
    expect(hrefs).not.toContain("/admin");
    expect(hrefs).not.toContain("/evaluator");
    expect(hrefs).not.toContain("/adjudicator");
    expect(hrefs).not.toContain("/consultant");
  });

  it("shows grouped administration categories and account links for an admin", () => {
    const groups = getNavigationForRoles(["admin"]);
    const groupIds = groups.map((group) => group.id);
    const programmesHrefs =
      groups.find((group) => group.id === "admin-programmes")?.items.map((item) => item.href) ?? [];
    const contentHrefs =
      groups.find((group) => group.id === "admin-content")?.items.map((item) => item.href) ?? [];
    const governanceHrefs =
      groups.find((group) => group.id === "admin-governance")?.items.map((item) => item.href) ?? [];
    const accountHrefs =
      groups.find((group) => group.id === "account")?.items.map((item) => item.href) ?? [];

    expect(groupIds).toEqual([
      "admin-programmes",
      "admin-content",
      "admin-governance",
      "account",
    ]);
    expect(programmesHrefs).toEqual([
      "/admin",
      "/admin/calls",
      "/admin/reviews",
      "/admin/awards",
    ]);
    expect(contentHrefs).toEqual([
      "/admin/categories",
      "/admin/content/faqs",
      "/admin/content/documents",
      "/admin/content/pages",
    ]);
    expect(governanceHrefs).toEqual([
      "/admin/users",
      "/admin/reports",
      "/admin/audit",
    ]);
    expect(accountHrefs).toEqual(["/profile", "/account/settings"]);
  });

  it("combines workspace sections cleanly for multi-role users", () => {
    const groups = getNavigationForRoles(["evaluator", "adjudicator", "committee_member"]);
    const reviewHrefs =
      groups.find((group) => group.id === "review")?.items.map((item) => item.href) ?? [];

    expect(groups.map((group) => group.id)).toEqual(["review", "account"]);
    expect(reviewHrefs).toEqual(["/evaluator", "/adjudicator", "/committee"]);
    expect(getPrimaryWorkspaceHref(["evaluator", "adjudicator"])).toBe("/adjudicator");
  });

  it("matches exact admin overview without false positives on admin sub-routes", () => {
    const groups = getNavigationForRoles(["admin"]);
    const adminItems = groups
      .filter((group) => group.id.startsWith("admin-"))
      .flatMap((group) => group.items);
    const overview = adminItems.find((item) => item.id === "admin-overview")!;
    const reports = adminItems.find((item) => item.id === "admin-reports")!;
    const calls = adminItems.find((item) => item.id === "admin-calls")!;

    expect(isNavItemActive("/admin", overview)).toBe(true);
    expect(isNavItemActive("/admin/reports", overview)).toBe(false);
    expect(isNavItemActive("/admin/reports", reports)).toBe(true);
    expect(isNavItemActive("/admin/calls", calls)).toBe(true);
    expect(isNavItemActive("/admin/calls/new", calls)).toBe(true);
    expect(isNavItemActive("/admin/calls/abc-123", calls)).toBe(true);
  });

  it("builds readable breadcrumbs from workspace paths", () => {
    expect(buildWorkspaceBreadcrumbs("/admin/content/faqs")).toEqual([
      { label: "Administration", href: "/admin" },
      { label: "Content", href: "/admin/content" },
      { label: "FAQs", href: "/admin/content/faqs" },
    ]);
  });
});
