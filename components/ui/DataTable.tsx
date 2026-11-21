import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  isRowHeader?: boolean;
  align?: "start" | "end";
  render: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  caption: string;
  hideCaption?: boolean;
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
  className?: string;
}

/**
 * Container-query responsive DataTable:
 * - Semantic `<table>`, `<caption>`, `<thead>`, `<tbody>`, `<th scope="col|row">`
 * - Keyboard-scrollable wrapper (`tabIndex={0}`, `role="region"`, `aria-labelledby`)
 * - Sticky column & row headers on wide containers; transforms into labeled stacked
 *   cards automatically via `@container (width < 600px)` regardless of viewport size
 */
export function DataTable<T>({
  caption,
  hideCaption = false,
  columns,
  rows,
  getRowKey,
  emptyMessage = "No records to display.",
  className,
}: DataTableProps<T>) {
  const captionId = useId();

  if (rows.length === 0) {
    return (
      <div className={cn("rounded-card border border-ceda-line bg-ceda-cream/55 p-card text-sm text-ceda-muted", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      tabIndex={0}
      role="region"
      aria-labelledby={captionId}
      className={cn("ds-table-wrap", className)}
    >
      <table className="ds-table">
        <caption
          id={captionId}
          className={
            hideCaption
              ? "sr-only"
              : "border-b border-ceda-line bg-white px-ds-4 py-ds-3 text-start text-xs font-bold uppercase tracking-[0.14em] text-ceda-muted"
          }
        >
          {caption}
        </caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={column.align === "end" ? "text-end" : "text-start"}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column, columnIndex) => {
                const isRowHeader = column.isRowHeader ?? columnIndex === 0;
                if (isRowHeader) {
                  return (
                    <th key={column.key} scope="row">
                      {column.render(row)}
                    </th>
                  );
                }
                return (
                  <td
                    key={column.key}
                    data-label={column.header}
                    className={column.align === "end" ? "text-end tabular-nums" : undefined}
                  >
                    <span>{column.render(row)}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
