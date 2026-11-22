"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { SelectDropdown } from "@/components/ui/SelectDropdown";

const PAGE_SIZE_OPTIONS = [
  { value: "5", label: "5 per page" },
  { value: "10", label: "10 per page" },
  { value: "20", label: "20 per page" },
] as const;

interface UsersTablePaginationProps {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  rowCount: number;
  canPrevious: boolean;
  canNext: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageSizeChange: (nextSize: number) => void;
}

export function UsersTablePagination({
  pageIndex,
  pageSize,
  pageCount,
  rowCount,
  canPrevious,
  canNext,
  onPreviousPage,
  onNextPage,
  onPageSizeChange,
}: UsersTablePaginationProps) {
  if (rowCount === 0) return null;

  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, rowCount);
  const displayPages = Math.max(1, pageCount);

  return (
    <nav
      aria-label="Users table pagination"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ceda-line bg-white px-5 py-3.5 shadow-xs"
    >
      <p className="text-xs text-ceda-muted tabular-nums">
        Showing{" "}
        <strong className="font-semibold text-ceda-ink">
          {start}–{end}
        </strong>{" "}
        of <strong className="font-semibold text-ceda-ink">{rowCount}</strong>{" "}
        {rowCount === 1 ? "account" : "accounts"}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-36">
          <SelectDropdown
            groupLabel="Rows per page"
            value={String(pageSize)}
            options={PAGE_SIZE_OPTIONS}
            onChange={(next) => onPageSizeChange(Number(next))}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={!canPrevious}
            onClick={onPreviousPage}
            className="inline-flex min-h-9 items-center gap-1 rounded-full border border-ceda-line bg-white px-3.5 text-xs font-semibold text-ceda-ink transition hover:border-ceda-burgundy/40 hover:bg-ceda-cream hover:text-ceda-burgundy disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
          >
            <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>

          <span className="px-2 text-xs font-semibold tabular-nums text-ceda-muted">
            Page {pageIndex + 1} of {displayPages}
          </span>

          <button
            type="button"
            disabled={!canNext}
            onClick={onNextPage}
            className="inline-flex min-h-9 items-center gap-1 rounded-full border border-ceda-line bg-white px-3.5 text-xs font-semibold text-ceda-ink transition hover:border-ceda-burgundy/40 hover:bg-ceda-cream hover:text-ceda-burgundy disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
          >
            <span>Next</span>
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
