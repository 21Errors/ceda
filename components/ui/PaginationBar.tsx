"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationBarProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  itemLabel?: string;
  onPageChange: (nextPage: number) => void;
}

export function PaginationBar({
  page,
  totalPages,
  totalCount,
  pageSize,
  itemLabel = "items",
  onPageChange,
}: PaginationBarProps) {
  if (totalCount === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ceda-line bg-white px-5 py-3.5 shadow-xs"
    >
      <p className="text-xs text-ceda-muted tabular-nums">
        Showing{" "}
        <strong className="font-semibold text-ceda-ink">
          {start}–{end}
        </strong>{" "}
        of <strong className="font-semibold text-ceda-ink">{totalCount}</strong>{" "}
        {itemLabel}
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex min-h-9 items-center gap-1 rounded-full border border-ceda-line bg-white px-3.5 text-xs font-semibold text-ceda-ink transition hover:border-ceda-burgundy/40 hover:bg-ceda-cream hover:text-ceda-burgundy disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
        >
          <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
          <span>Previous</span>
        </button>

        <span className="px-2 text-xs font-semibold tabular-nums text-ceda-muted">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex min-h-9 items-center gap-1 rounded-full border border-ceda-line bg-white px-3.5 text-xs font-semibold text-ceda-ink transition hover:border-ceda-burgundy/40 hover:bg-ceda-cream hover:text-ceda-burgundy disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
        >
          <span>Next</span>
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </div>
    </nav>
  );
}
