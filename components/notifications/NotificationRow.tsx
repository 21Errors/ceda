"use client";

import { Archive, ArchiveRestore, Check } from "lucide-react";
import type { NotificationItem, NotificationView } from "./types";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-BW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Gaborone",
});

interface NotificationRowProps {
  item: NotificationItem;
  view: NotificationView;
  disabled: boolean;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
}

export function NotificationRow({
  item,
  view,
  disabled,
  onMarkRead,
  onArchive,
  onUnarchive,
}: NotificationRowProps) {
  const isUnread = !item.readAt && view === "inbox";

  return (
    <li
      className={`rounded-xl border p-4 transition-colors ${
        isUnread
          ? "border-ceda-burgundy/25 bg-[#FFF9F4]"
          : "border-ceda-line bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
            isUnread ? "bg-ceda-burgundy" : "bg-transparent"
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-sm font-bold leading-snug text-ceda-ink">
              {item.title}
            </h3>
            <time
              className="shrink-0 text-[11px] tabular-nums text-ceda-muted"
              dateTime={item.createdAt}
            >
              {DATE_TIME_FORMATTER.format(new Date(item.createdAt))}
            </time>
          </div>

          {item.body ? (
            <p className="mt-1 wrap-break-word text-sm leading-6 text-ceda-body">
              {item.body}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {view === "inbox" ? (
              <>
                {isUnread ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onMarkRead(item.id)}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-ceda-line bg-white px-3 text-xs font-semibold text-ceda-ink transition hover:border-ceda-burgundy/35 hover:text-ceda-burgundy disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                  >
                    <Check aria-hidden="true" className="h-3.5 w-3.5" />
                    <span>Mark read</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onArchive(item.id)}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-ceda-line bg-white px-3 text-xs font-semibold text-ceda-muted transition hover:border-ceda-burgundy/35 hover:text-ceda-burgundy disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
                >
                  <Archive aria-hidden="true" className="h-3.5 w-3.5" />
                  <span>Archive</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onUnarchive(item.id)}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-ceda-line bg-white px-3 text-xs font-semibold text-ceda-burgundy transition hover:bg-ceda-cream disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
              >
                <ArchiveRestore aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Restore to inbox</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
