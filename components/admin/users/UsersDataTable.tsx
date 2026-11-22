"use client";

import { useId, useState } from "react";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Users } from "lucide-react";
import { AssignRoleForm } from "@/components/admin/AssignRoleForm";
import type { AdminRoleOption, AdminUserTableRow } from "./types";
import {
  UsersTableFilters,
  type VerificationFilterValue,
} from "./UsersTableFilters";
import { UsersTablePagination } from "./UsersTablePagination";

const textCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

// TanStack Table v9 explicit tree-shakeable features & row models declared statically.
const usersTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
  },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
  },
  columnMeta: {} as {
    label: string;
    isRowHeader?: boolean;
  },
});

const columnHelper = createColumnHelper<
  typeof usersTableFeatures,
  AdminUserTableRow
>();

const usersColumns = columnHelper.columns([
  columnHelper.accessor("name", {
    id: "name",
    header: "User",
    meta: { label: "User", isRowHeader: true },
    sortFn: (rowA, rowB) =>
      textCollator.compare(rowA.original.name, rowB.original.name),
    cell: ({ row }) => (
      <div className="min-w-0">
        <p
          id={`user-title-${row.original.id}`}
          className="truncate font-semibold text-ceda-ink"
        >
          {row.original.name}
        </p>
        <p className="truncate text-xs font-normal text-ceda-muted">
          {row.original.email}
        </p>
      </div>
    ),
  }),
  columnHelper.accessor("emailVerified", {
    id: "emailVerified",
    header: "Email status",
    meta: { label: "Email status" },
    enableGlobalFilter: false,
    filterFn: (row, _columnId, filterValue: VerificationFilterValue) => {
      if (!filterValue || filterValue === "all") return true;
      return filterValue === "verified"
        ? row.original.emailVerified
        : !row.original.emailVerified;
    },
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
          row.original.emailVerified
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-neutral-200 bg-neutral-100 text-neutral-700"
        }`}
      >
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 rounded-full ${
            row.original.emailVerified ? "bg-emerald-600" : "bg-neutral-400"
          }`}
        />
        {row.original.emailVerified ? "Verified" : "Not verified"}
      </span>
    ),
  }),
  columnHelper.accessor(
    (row) => row.currentRoles.map((role) => role.name).join(", "),
    {
      id: "roles",
      header: "Roles",
      meta: { label: "Roles" },
      enableSorting: false,
      filterFn: (row, _columnId, filterValue: string) => {
        if (!filterValue || filterValue === "all") return true;
        if (filterValue === "__none__") {
          return row.original.currentRoles.length === 0;
        }
        return row.original.currentRoles.some(
          (role) => role.key === filterValue,
        );
      },
      cell: ({ row }) =>
        row.original.currentRoles.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {row.original.currentRoles.map((role) => (
              <span
                key={role.id}
                className="rounded-full bg-[#FFF1E4] px-2.5 py-0.5 text-xs font-semibold text-ceda-burgundy"
              >
                {role.name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-ceda-muted">No roles assigned</span>
        ),
    },
  ),
  columnHelper.accessor("createdAtIso", {
    id: "createdAtIso",
    header: "Joined",
    meta: { label: "Joined" },
    enableGlobalFilter: false,
    cell: ({ row }) => (
      <time
        dateTime={row.original.createdAtIso}
        className="whitespace-nowrap text-xs text-ceda-muted tabular-nums"
      >
        {row.original.createdAtLabel}
      </time>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: "Assign role",
    meta: { label: "Assign role" },
    cell: ({ row }) =>
      row.original.availableRoles.length > 0 ? (
        <AssignRoleForm
          userId={row.original.id}
          availableRoles={row.original.availableRoles}
        />
      ) : (
        <span className="text-xs text-ceda-muted">All roles assigned</span>
      ),
  }),
]);

interface UsersDataTableProps {
  users: AdminUserTableRow[];
  roleOptions: readonly AdminRoleOption[];
}

export function UsersDataTable({ users, roleOptions }: UsersDataTableProps) {
  const captionId = useId();
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAtIso", desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sortStatusText, setSortStatusText] = useState("");

  const table = useTable({
    features: usersTableFeatures,
    data: users,
    columns: usersColumns,
    state: {
      globalFilter,
      columnFilters,
      sorting,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const needle = String(filterValue ?? "").trim().toLowerCase();
      if (!needle) return true;
      const { name, email, currentRoles } = row.original;
      return (
        name.toLowerCase().includes(needle) ||
        email.toLowerCase().includes(needle) ||
        currentRoles.some((role) => role.name.toLowerCase().includes(needle))
      );
    },
  });

  const roleFilterValue =
    (table.state.columnFilters.find((item) => item.id === "roles")
      ?.value as string) ?? "all";
  const verificationFilterValue =
    (table.state.columnFilters.find((item) => item.id === "emailVerified")
      ?.value as VerificationFilterValue) ?? "all";

  const pageRows = table.getRowModel().rows;
  const filteredRowCount = table.getRowCount();

  function updateColumnFilter(columnId: string, nextValue: string) {
    setColumnFilters((prev) => {
      const rest = prev.filter((item) => item.id !== columnId);
      if (!nextValue || nextValue === "all") return rest;
      return [...rest, { id: columnId, value: nextValue }];
    });
    table.firstPage();
  }

  function handleResetFilters() {
    setGlobalFilter("");
    setColumnFilters([]);
    table.firstPage();
  }

  return (
    <div className="mt-6 space-y-4">
      <UsersTableFilters
        globalFilter={globalFilter}
        onGlobalFilterChange={(value) => {
          setGlobalFilter(value);
          table.firstPage();
        }}
        roleFilter={roleFilterValue}
        onRoleFilterChange={(value) => updateColumnFilter("roles", value)}
        verificationFilter={verificationFilterValue}
        onVerificationFilterChange={(value) =>
          updateColumnFilter("emailVerified", value)
        }
        roleOptions={roleOptions}
        totalCount={users.length}
        filteredCount={filteredRowCount}
        onResetFilters={handleResetFilters}
      />

      {/* Single polite status region for sort announcements */}
      <p role="status" className="sr-only">
        {sortStatusText}
      </p>

      {pageRows.length > 0 ? (
        <>
          <div
            tabIndex={0}
            role="region"
            aria-labelledby={captionId}
            className="ds-table-wrap rounded-2xl border border-ceda-line bg-white shadow-xs"
          >
            <table className="ds-table min-w-170">
              <caption id={captionId} className="sr-only">
                Portal users and assigned workspace roles
              </caption>
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sorted = header.column.getIsSorted();
                      const ariaSort =
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : undefined;
                      const columnLabel =
                        header.column.columnDef.meta?.label ?? header.id;

                      return (
                        <th
                          key={header.id}
                          scope="col"
                          aria-sort={ariaSort}
                          className={canSort ? "p-0" : undefined}
                        >
                          {header.isPlaceholder ? null : canSort ? (
                            <button
                              type="button"
                              onClick={() => {
                                const nextDesc = sorted === "asc";
                                setSorting([
                                  { id: header.column.id, desc: nextDesc },
                                ]);
                                setSortStatusText(
                                  `Sorted by ${columnLabel}, ${
                                    nextDesc ? "descending" : "ascending"
                                  }, ${filteredRowCount} rows`,
                                );
                              }}
                              className="inline-flex min-h-10 w-full items-center gap-1.5 px-ds-4 py-ds-3 text-start text-xs font-bold uppercase tracking-wider text-ceda-muted transition hover:text-ceda-burgundy focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ceda-orange"
                            >
                              <span>
                                <table.FlexRender header={header} />
                              </span>
                              {sorted === "asc" ? (
                                <ArrowUp
                                  aria-hidden="true"
                                  className="h-3.5 w-3.5 shrink-0 text-ceda-burgundy"
                                />
                              ) : sorted === "desc" ? (
                                <ArrowDown
                                  aria-hidden="true"
                                  className="h-3.5 w-3.5 shrink-0 text-ceda-burgundy"
                                />
                              ) : (
                                <ArrowUpDown
                                  aria-hidden="true"
                                  className="h-3.5 w-3.5 shrink-0 opacity-50"
                                />
                              )}
                            </button>
                          ) : (
                            <table.FlexRender header={header} />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>

              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id}>
                    {row.getAllCells().map((cell) => {
                      const meta = cell.column.columnDef.meta;
                      if (meta?.isRowHeader) {
                        return (
                          <th key={cell.id} scope="row">
                            <table.FlexRender cell={cell} />
                          </th>
                        );
                      }
                      return (
                        <td key={cell.id} data-label={meta?.label ?? ""}>
                          <table.FlexRender cell={cell} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <UsersTablePagination
            pageIndex={table.state.pagination.pageIndex}
            pageSize={table.state.pagination.pageSize}
            pageCount={table.getPageCount()}
            rowCount={filteredRowCount}
            canPrevious={table.getCanPreviousPage()}
            canNext={table.getCanNextPage()}
            onPreviousPage={() => table.previousPage()}
            onNextPage={() => table.nextPage()}
            onPageSizeChange={(size) => {
              table.setPageSize(size);
              table.firstPage();
            }}
          />
        </>
      ) : (
        <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center shadow-xs">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-500"
          >
            <Users className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-ceda-ink">
            No matching accounts
          </p>
          <p className="mt-1 text-xs text-ceda-muted">
            Try another name, email, or role filter.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 inline-flex min-h-9 items-center rounded-full border border-ceda-line bg-white px-4 text-xs font-semibold text-ceda-burgundy transition hover:bg-ceda-cream"
          >
            Clear filters
          </button>
        </section>
      )}
    </div>
  );
}
