"use client";

import { Search, X } from "lucide-react";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { cn } from "@/lib/cn";
import type { AdminRoleOption } from "./types";

export type VerificationFilterValue = "all" | "verified" | "unverified";

interface UsersTableFiltersProps {
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  verificationFilter: VerificationFilterValue;
  onVerificationFilterChange: (value: VerificationFilterValue) => void;
  roleOptions: readonly AdminRoleOption[];
  totalCount: number;
  filteredCount: number;
  onResetFilters: () => void;
}

const VERIFICATION_TABS: readonly {
  key: VerificationFilterValue;
  label: string;
}[] = [
  { key: "all", label: "All accounts" },
  { key: "verified", label: "Verified" },
  { key: "unverified", label: "Unverified" },
];

export function UsersTableFilters({
  globalFilter,
  onGlobalFilterChange,
  roleFilter,
  onRoleFilterChange,
  verificationFilter,
  onVerificationFilterChange,
  roleOptions,
  totalCount,
  filteredCount,
  onResetFilters,
}: UsersTableFiltersProps) {
  const hasFilters =
    globalFilter.trim().length > 0 ||
    roleFilter !== "all" ||
    verificationFilter !== "all";

  return (
    <search className="rounded-2xl border border-ceda-line bg-white p-4 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Filter users by email verification"
        >
          {VERIFICATION_TABS.map((tab) => {
            const active = verificationFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={active}
                onClick={() => onVerificationFilterChange(tab.key)}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-full border px-3.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange",
                  active
                    ? "border-ceda-burgundy bg-ceda-burgundy text-white"
                    : "border-ceda-line bg-white text-ceda-body hover:bg-ceda-cream hover:text-ceda-burgundy",
                )}
              >
                {tab.label}
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
            <label htmlFor="users-table-search" className="sr-only">
              Search users by name, email, or role
            </label>
            <input
              id="users-table-search"
              type="search"
              value={globalFilter}
              onChange={(event) => onGlobalFilterChange(event.target.value)}
              placeholder="Search name or email..."
              autoCorrect="off"
              className="min-w-0 flex-1 bg-transparent text-sm text-ceda-ink placeholder:text-ceda-muted/75 focus:outline-none"
            />
            {globalFilter ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => onGlobalFilterChange("")}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ceda-muted hover:bg-neutral-100 hover:text-ceda-ink"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="sm:w-48">
            <SelectDropdown
              groupLabel="Filter by role"
              value={roleFilter}
              options={[
                { value: "all", label: "All roles" },
                { value: "__none__", label: "No roles assigned" },
                ...roleOptions.map((role) => ({
                  value: role.key,
                  label: role.name,
                })),
              ]}
              onChange={onRoleFilterChange}
            />
          </div>

          {hasFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-ceda-line bg-white px-3.5 text-xs font-semibold text-ceda-burgundy transition hover:bg-ceda-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
            >
              Clear ({filteredCount}/{totalCount})
            </button>
          ) : null}
        </div>
      </div>
    </search>
  );
}
