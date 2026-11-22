import Link from "next/link";
import {
  BookOpenCheck,
  ChevronRight,
  FileText,
  GitPullRequestArrow,
  Megaphone,
  Tags,
  Trophy,
  Users,
} from "lucide-react";
import type { AdminOverviewData } from "@/lib/server/admin-overview";

type AdminOperationsPanelProps = Pick<
  AdminOverviewData,
  | "totalUsersCount"
  | "activePipelineCount"
  | "awardsCount"
  | "activeCategoriesCount"
  | "publishedFaqsCount"
  | "publishedDocumentsCount"
  | "publishedPagesCount"
>;

interface OperationLinkItem {
  label: string;
  description: string;
  href: string;
  count: number;
  icon: typeof Users;
}

function OperationList({ items }: { items: OperationLinkItem[] }) {
  return (
    <ul className="divide-y divide-ceda-line/70">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group flex items-center gap-ds-3 px-card py-2.5 transition-colors hover:bg-ceda-cream/55 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ceda-orange"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ceda-cream text-ceda-burgundy transition-colors group-hover:bg-ceda-cream-mid"
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ceda-ink group-hover:text-ceda-burgundy">
                  {item.label}
                </span>
                <span className="block truncate text-xs text-ceda-muted">
                  {item.description}
                </span>
              </span>
              <span className="inline-flex min-w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted px-2 py-0.5 text-xs font-bold tabular-nums text-ceda-body">
                {item.count}
              </span>
              <ChevronRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-ceda-muted/70 transition-transform group-hover:translate-x-0.5 group-hover:text-ceda-burgundy"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminOperationsPanel({
  totalUsersCount,
  activePipelineCount,
  awardsCount,
  activeCategoriesCount,
  publishedFaqsCount,
  publishedDocumentsCount,
  publishedPagesCount,
}: AdminOperationsPanelProps) {
  const governanceItems: OperationLinkItem[] = [
    {
      label: "Users and roles",
      description: "Assign staff roles and verify accounts",
      href: "/admin/users",
      count: totalUsersCount,
      icon: Users,
    },
    {
      label: "Review pipeline",
      description: "Monitor active evaluations and stages",
      href: "/admin/reviews",
      count: activePipelineCount,
      icon: GitPullRequestArrow,
    },
    {
      label: "Grant awards",
      description: "Issue and manage funding awards",
      href: "/admin/awards",
      count: awardsCount,
      icon: Trophy,
    },
    {
      label: "Submission categories",
      description: "Maintain sector and theme taxonomy",
      href: "/admin/categories",
      count: activeCategoriesCount,
      icon: Tags,
    },
  ];

  const contentItems: OperationLinkItem[] = [
    {
      label: "FAQ content",
      description: "Published applicant help articles",
      href: "/admin/content/faqs",
      count: publishedFaqsCount,
      icon: BookOpenCheck,
    },
    {
      label: "Document templates",
      description: "Downloadable forms and guides",
      href: "/admin/content/documents",
      count: publishedDocumentsCount,
      icon: FileText,
    },
    {
      label: "Pages and news",
      description: "Public guidelines and announcements",
      href: "/admin/content/pages",
      count: publishedPagesCount,
      icon: Megaphone,
    },
  ];

  return (
    <section
      aria-labelledby="operations-heading"
      className="overflow-hidden rounded-card border border-ceda-line bg-white shadow-xs"
    >
      <div className="border-b border-ceda-line px-card py-ds-4">
        <h2 id="operations-heading" className="text-base font-bold text-ceda-ink">
          Portal operations
        </h2>
        <p className="mt-0.5 text-xs text-ceda-muted">
          Direct access to governance controls and published resources.
        </p>
      </div>

      <div>
        <h3 className="border-b border-ceda-line/70 bg-ceda-cream/70 px-card py-2 text-xs font-semibold text-ceda-muted">
          Governance &amp; review
        </h3>
        <OperationList items={governanceItems} />

        <h3 className="border-y border-ceda-line/70 bg-ceda-cream/70 px-card py-2 text-xs font-semibold text-ceda-muted">
          Public portal content
        </h3>
        <OperationList items={contentItems} />
      </div>
    </section>
  );
}
