"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface NotificationsPaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  disabled: boolean;
  onPageChange: (nextPage: number) => void;
}

export function NotificationsPagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  disabled,
  onPageChange,
}: NotificationsPaginationProps) {
  if (totalCount === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <nav
      aria-label="Notifications pagination"
      className="flex flex-wrap items-center gap-3"
    >
      <span className="text-xs tabular-nums text-ceda-muted">
        Showing {start}–{end} of {totalCount}
      </span>

      {totalPages > 1 ? (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
            className="inline-flex min-h-9 items-center gap-1 rounded-full border border-ceda-line bg-white px-3 text-xs font-semibold text-ceda-ink transition hover:bg-ceda-cream hover:text-ceda-burgundy disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
          >
            <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Prev</span>
          </button>

          <span className="px-1.5 text-xs font-semibold tabular-nums text-ceda-body">
            {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={disabled || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
            className="inline-flex min-h-9 items-center gap-1 rounded-full border border-ceda-line bg-white px-3 text-xs font-semibold text-ceda-ink transition hover:bg-ceda-cream hover:text-ceda-burgundy disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
          >
            <span>Next</span>
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </nav>
  );
}
