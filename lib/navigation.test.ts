import { describe, expect, it } from "vitest";
import {
  buildWorkspaceBreadcrumbs,
  getNavigationForRoles,
  getPrimaryWorkspaceHref,
  isNavItemActive,
} from "./navigation";

describe("RBAC workspace navigation", () => {
  it("shows only submitter and account links for a submitter", () => {
    const groups = getNavigationForRoles(["submitter"], 3);
    const groupIds = groups.map((group) => group.id);
    const hrefs = groups.flatMap((group) => group.items.map((item) => item.href));

    expect(groupIds).toEqual(["submitter", "account"]);
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/submit");
    expect(hrefs).toContain("/track");
    expect(hrefs).not.toContain("/admin");
    expect(hrefs).not.toContain("/evaluator");
    expect(hrefs).not.toContain("/adjudicator");
    expect(hrefs).not.toContain("/consultant");

    const notificationsItem = groups
      .find((group) => group.id === "account")
      ?.items.find((item) => item.id === "notifications");
    expect(notificationsItem?.badge).toBe("3");
  });

  it("shows administration and account links for an admin", () => {
    const groups = getNavigationForRoles(["admin"], 120);
    const groupIds = groups.map((group) => group.id);
    const adminHrefs =
      groups.find((group) => group.id === "administration")?.items.map((item) => item.href) ?? [];

    expect(groupIds).toEqual(["administration", "account"]);
    expect(adminHrefs).toEqual([
      "/admin",
      "/admin/calls/new",
      "/admin/users",
      "/admin/reviews",
      "/admin/awards",
      "/admin/categories",
      "/admin/content/faqs",
      "/admin/content/documents",
      "/admin/content/pages",
      "/admin/reports",
      "/admin/audit",
    ]);

    const notificationsItem = groups
      .find((group) => group.id === "account")
      ?.items.find((item) => item.id === "notifications");
    expect(notificationsItem?.badge).toBe("99+");
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
    const adminItems = groups.find((group) => group.id === "administration")?.items ?? [];
    const overview = adminItems.find((item) => item.id === "admin-overview")!;
    const reports = adminItems.find((item) => item.id === "admin-reports")!;
    const calls = adminItems.find((item) => item.id === "admin-calls-new")!;

    expect(isNavItemActive("/admin", overview)).toBe(true);
    expect(isNavItemActive("/admin/reports", overview)).toBe(false);
    expect(isNavItemActive("/admin/reports", reports)).toBe(true);
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
