import Link from "next/link";
import {
  ChevronRight,
  ClipboardCheck,
  Inbox,
  Megaphone,
  Users,
} from "lucide-react";
import type { AdminOverviewData } from "@/lib/server/admin-overview";

type AdminKpiStripProps = Pick<
  AdminOverviewData,
  | "openCallsCount"
  | "activePipelineCount"
  | "pendingReviewsCount"
  | "totalUsersCount"
>;

export function AdminKpiStrip({
  openCallsCount,
  activePipelineCount,
  pendingReviewsCount,
  totalUsersCount,
}: AdminKpiStripProps) {
  const kpiCards = [
    {
      label: "Open calls",
      value: openCallsCount,
      icon: Megaphone,
      iconTone: "bg-[#F3E9E5] text-ceda-burgundy",
      href: "/admin/calls",
      actionLabel: "View all calls",
    },
    {
      label: "Active submissions",
      value: activePipelineCount,
      icon: Inbox,
      iconTone: "bg-ceda-cream-mid text-[#C56500]",
      href: "/admin/reviews",
      actionLabel: "Review pipeline",
    },
    {
      label: "Pending reviews",
      value: pendingReviewsCount,
      icon: ClipboardCheck,
      iconTone: "bg-[var(--status-info-bg)] text-[#315EDB]",
      href: "/admin/reviews",
      actionLabel: "Open queue",
    },
    {
      label: "Registered accounts",
      value: totalUsersCount,
      icon: Users,
      iconTone: "bg-[var(--status-success-bg)] text-[#13844A]",
      href: "/admin/users",
      actionLabel: "Manage roles",
    },
  ];

  return (
    <section aria-label="Portal overview metrics">
      <div className="grid grid-cols-1 gap-ds-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="row-span-3 grid grid-rows-subgrid gap-y-ds-2 rounded-card border border-ceda-line bg-white p-ds-5 shadow-xs">
              <div className="flex items-center justify-between gap-ds-3">
                <span className="text-sm font-semibold text-ceda-body">
                  {card.label}
                </span>
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.iconTone}`}>
                  <Icon className="h-4.5 w-4.5" />
                </span>
              </div>

              <p className="self-center py-1 text-3xl font-extrabold tabular-nums tracking-tight text-ceda-ink">
                {card.value}
              </p>

              <div className="flex items-end justify-end gap-ds-2">
                <Link
                  href={card.href}
                  aria-label={`${card.actionLabel} (${card.label})`}
                  className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-ceda-burgundy hover:underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange">
                  <span>View</span>
                  <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
