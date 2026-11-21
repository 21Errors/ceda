import type { PortalRole } from "@/lib/authorization";

export type NavIconKey =
  | "dashboard"
  | "submit"
  | "track"
  | "evaluator"
  | "adjudicator"
  | "committee"
  | "consultant"
  | "admin"
  | "calls"
  | "users"
  | "reviews"
  | "awards"
  | "categories"
  | "faqs"
  | "reports"
  | "audit"
  | "notifications"
  | "profile"
  | "settings";

export interface WorkspaceNavItem {
  id: string;
  label: string;
  href: string;
  icon: NavIconKey;
  exact?: boolean;
  badge?: string;
  roles?: readonly PortalRole[];
}

export interface WorkspaceNavGroup {
  id: string;
  label: string;
  items: WorkspaceNavItem[];
}

export interface RoleMeta {
  key: PortalRole;
  label: string;
  shortLabel: string;
  homeHref: string;
}

export const ROLE_METADATA: Record<PortalRole, RoleMeta> = {
  submitter: {
    key: "submitter",
    label: "Submitter",
    shortLabel: "Applicant",
    homeHref: "/dashboard",
  },
  evaluator: {
    key: "evaluator",
    label: "Evaluator",
    shortLabel: "Evaluator",
    homeHref: "/evaluator",
  },
  adjudicator: {
    key: "adjudicator",
    label: "Adjudicator",
    shortLabel: "Adjudicator",
    homeHref: "/adjudicator",
  },
  committee_member: {
    key: "committee_member",
    label: "Committee Member",
    shortLabel: "Committee",
    homeHref: "/committee",
  },
  consultant: {
    key: "consultant",
    label: "Service Consultant",
    shortLabel: "Consultant",
    homeHref: "/consultant",
  },
  admin: {
    key: "admin",
    label: "Administrator",
    shortLabel: "Admin",
    homeHref: "/admin",
  },
};

const ALL_NAV_GROUPS: readonly WorkspaceNavGroup[] = [
  {
    id: "submitter",
    label: "Innovation Workspace",
    items: [
      {
        id: "dashboard",
        label: "Overview",
        href: "/dashboard",
        icon: "dashboard",
        roles: ["submitter"],
      },
      {
        id: "submit",
        label: "Submit Idea",
        href: "/submit",
        icon: "submit",
        roles: ["submitter"],
      },
      {
        id: "track",
        label: "Track Status",
        href: "/track",
        icon: "track",
        roles: ["submitter"],
      },
    ],
  },
  {
    id: "review",
    label: "Evaluation & Oversight",
    items: [
      {
        id: "evaluator",
        label: "Evaluation Queue",
        href: "/evaluator",
        icon: "evaluator",
        roles: ["evaluator"],
      },
      {
        id: "adjudicator",
        label: "Adjudication Panel",
        href: "/adjudicator",
        icon: "adjudicator",
        roles: ["adjudicator"],
      },
      {
        id: "committee",
        label: "Committee Monitor",
        href: "/committee",
        icon: "committee",
        roles: ["committee_member"],
      },
      {
        id: "consultant",
        label: "Live Support Desk",
        href: "/consultant",
        icon: "consultant",
        roles: ["consultant"],
      },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    items: [
      {
        id: "admin-overview",
        label: "Admin Overview",
        href: "/admin",
        icon: "admin",
        exact: true,
        roles: ["admin"],
      },
      {
        id: "admin-calls-new",
        label: "New Innovation Call",
        href: "/admin/calls/new",
        icon: "calls",
        roles: ["admin"],
      },
      {
        id: "admin-users",
        label: "Users & Roles",
        href: "/admin/users",
        icon: "users",
        roles: ["admin"],
      },
      {
        id: "admin-reviews",
        label: "Review Pipeline",
        href: "/admin/reviews",
        icon: "reviews",
        roles: ["admin"],
      },
      {
        id: "admin-awards",
        label: "Awards",
        href: "/admin/awards",
        icon: "awards",
        roles: ["admin"],
      },
      {
        id: "admin-categories",
        label: "Categories",
        href: "/admin/categories",
        icon: "categories",
        roles: ["admin"],
      },
      {
        id: "admin-faqs",
        label: "FAQ Content",
        href: "/admin/content/faqs",
        icon: "faqs",
        roles: ["admin"],
      },
      {
        id: "admin-reports",
        label: "Reports & Analytics",
        href: "/admin/reports",
        icon: "reports",
        roles: ["admin"],
      },
      {
        id: "admin-audit",
        label: "Audit Trail",
        href: "/admin/audit",
        icon: "audit",
        roles: ["admin"],
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      {
        id: "notifications",
        label: "Notifications",
        href: "/notifications",
        icon: "notifications",
      },
      {
        id: "profile",
        label: "My Profile",
        href: "/profile",
        icon: "profile",
      },
      {
        id: "settings",
        label: "Account Settings",
        href: "/account/settings",
        icon: "settings",
      },
    ],
  },
];

export function getNavigationForRoles(
  userRoles: readonly PortalRole[],
  unreadNotifications = 0,
): WorkspaceNavGroup[] {
  const roleSet = new Set<PortalRole>(userRoles);
  const groups: WorkspaceNavGroup[] = [];

  for (const group of ALL_NAV_GROUPS) {
    const visibleItems = group.items
      .filter((item) => !item.roles || item.roles.some((role) => roleSet.has(role)))
      .map((item) => {
        if (item.id === "notifications" && unreadNotifications > 0) {
          return {
            ...item,
            badge: unreadNotifications > 99 ? "99+" : String(unreadNotifications),
          };
        }
        return item;
      });

    if (visibleItems.length > 0) {
      groups.push({ id: group.id, label: group.label, items: visibleItems });
    }
  }

  return groups;
}

export function getPrimaryWorkspaceHref(userRoles: readonly PortalRole[]): string {
  const priority: readonly PortalRole[] = [
    "admin",
    "adjudicator",
    "evaluator",
    "committee_member",
    "consultant",
    "submitter",
  ];
  for (const role of priority) {
    if (userRoles.includes(role)) {
      return ROLE_METADATA[role].homeHref;
    }
  }
  return "/dashboard";
}

export function isNavItemActive(pathname: string, item: WorkspaceNavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  if (item.href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  }
  if (item.href === "/admin/calls/new") {
    return pathname === "/admin/calls/new" || pathname.startsWith("/admin/calls/");
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  submissions: "Submissions",
  submit: "Submit Idea",
  track: "Track Submission",
  evaluator: "Evaluator",
  assignments: "Review",
  adjudicator: "Adjudication",
  committee: "Committee",
  consultant: "Service Desk",
  admin: "Administration",
  calls: "Innovation Calls",
  new: "New Call",
  users: "Users & Roles",
  reviews: "Review Pipeline",
  awards: "Awards",
  categories: "Categories",
  content: "Content",
  faqs: "FAQs",
  reports: "Reports",
  audit: "Audit Trail",
  account: "Account",
  settings: "Settings",
  profile: "My Profile",
  notifications: "Notifications",
};

export interface BreadcrumbCrumb {
  label: string;
  href: string;
}

export function buildWorkspaceBreadcrumbs(pathname: string): BreadcrumbCrumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: BreadcrumbCrumb[] = [];
  let currentPath = "";

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const mapped = SEGMENT_LABELS[segment];
    const label = mapped ?? (segment.length > 14 ? "Details" : segment.replaceAll("-", " "));
    crumbs.push({ label, href: currentPath });
  }

  return crumbs;
}
