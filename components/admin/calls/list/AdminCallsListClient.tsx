"use client";

import { useMemo, useState } from "react";
import { FolderPlus, Plus, Search, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { cn } from "@/lib/cn";
import type {
  AdminCallListItem,
  AdminCallStatus,
} from "@/lib/server/admin-calls";
import { AdminCallListCard } from "./AdminCallListCard";

type StatusFilter = "all" | AdminCallStatus;
type SortKey = "newest" | "closing_soon" | "most_applications" | "title";

const PAGE_SIZE = 5;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "closing_soon", label: "Closing soonest" },
  { value: "most_applications", label: "Most applications" },
  { value: "title", label: "Title (A–Z)" },
] as const;

export function AdminCallsListClient({
  calls,
}: {
  calls: readonly AdminCallListItem[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: calls.length,
      open: 0,
      draft: 0,
      closed: 0,
      archived: 0,
    };
    for (const call of calls) {
      counts[call.status] += 1;
    }
    return counts;
  }, [calls]);

  const filteredCalls = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const list = calls.filter((call) => {
      if (statusFilter !== "all" && call.status !== statusFilter) return false;
      if (!normalized) return true;
      return (
        call.title.toLowerCase().includes(normalized) ||
        (call.description?.toLowerCase().includes(normalized) ?? false)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "most_applications") {
        return b.submissionsTotal - a.submissionsTotal;
      }
      if (sortBy === "closing_soon") {
        if (!a.closesAtIso && !b.closesAtIso) return 0;
        if (!a.closesAtIso) return 1;
        if (!b.closesAtIso) return -1;
        return a.closesAtIso.localeCompare(b.closesAtIso);
      }
      return b.createdAtIso.localeCompare(a.createdAtIso);
    });
  }, [calls, query, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredCalls.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedCalls = useMemo(
    () =>
      filteredCalls.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredCalls, safePage],
  );

  if (calls.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center shadow-xs">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ceda-cream-mid text-ceda-burgundy"
        >
          <FolderPlus className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-base font-bold text-ceda-ink">
          No innovation calls yet
        </h2>
        <p className="mt-1.5 max-w-md text-sm leading-6 text-ceda-muted">
          Create your first innovation call to set up an application form,
          review stages, and scoring criteria.
        </p>
        <div className="mt-5">
          <ButtonLink
            href="/admin/calls/new"
            variant="primary"
            size="md"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create your first call
          </ButtonLink>
        </div>
      </section>
    );
  }

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "draft", label: "Draft" },
    { key: "closed", label: "Closed" },
    { key: "archived", label: "Archived" },
  ];

  const hasFilters = query.trim().length > 0 || statusFilter !== "all";

  return (
    <div className="space-y-4">
      {/* Search, status filters & sort bar */}
      <search className="rounded-2xl border border-ceda-line bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filter calls by status"
          >
            {filterTabs.map((tab) => {
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setStatusFilter(tab.key);
                    setPage(1);
                  }}
                  className={cn(
                    "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange",
                    active
                      ? "border-ceda-burgundy bg-ceda-burgundy text-white"
                      : "border-ceda-line bg-white text-ceda-body hover:bg-ceda-cream hover:text-ceda-burgundy",
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-neutral-100 text-ceda-muted",
                    )}
                  >
                    {statusCounts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="flex min-h-12 min-w-0 items-center gap-2 rounded-control border border-[rgba(122,31,20,0.28)] bg-white px-3.5 transition hover:border-[rgba(122,31,20,0.52)] focus-within:border-ceda-burgundy focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-ceda-orange sm:w-64">
              <Search
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-ceda-muted"
              />
              <label htmlFor="calls-search" className="sr-only">
                Search innovation calls
              </label>
              <input
                id="calls-search"
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search calls..."
                autoCorrect="off"
                className="min-w-0 flex-1 bg-transparent text-sm text-ceda-ink placeholder:text-ceda-muted/75 focus:outline-none"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    setPage(1);
                  }}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ceda-muted hover:bg-neutral-100 hover:text-ceda-ink"
                >
                  <X aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <div className="sm:w-48">
              <SelectDropdown
                groupLabel="Sort calls"
                value={sortBy}
                options={SORT_OPTIONS}
                onChange={(next) => {
                  setSortBy(next as SortKey);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </search>

      {/* Results list */}
      {paginatedCalls.length > 0 ? (
        <>
          <div className="space-y-3">
            {paginatedCalls.map((call) => (
              <AdminCallListCard key={call.id} call={call} />
            ))}
          </div>

          <PaginationBar
            page={safePage}
            totalPages={totalPages}
            totalCount={filteredCalls.length}
            pageSize={PAGE_SIZE}
            itemLabel={filteredCalls.length === 1 ? "call" : "calls"}
            onPageChange={setPage}
          />
        </>
      ) : (
        <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center shadow-xs">
          <p className="text-sm font-semibold text-ceda-ink">
            No calls match your filter
          </p>
          <p className="mt-1 text-xs text-ceda-muted">
            Try another search term or switch back to all calls.
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
                setPage(1);
              }}
              className="mt-4 inline-flex min-h-9 items-center rounded-full border border-ceda-line bg-white px-4 text-xs font-semibold text-ceda-burgundy transition hover:bg-ceda-cream"
            >
              Clear filters
            </button>
          ) : null}
        </section>
      )}
    </div>
  );
}
