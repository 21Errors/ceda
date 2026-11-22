"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Bell, CheckCheck, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/Alert";
import { Dialog } from "@/components/ui/Dialog";
import { NotificationRow } from "./NotificationRow";
import { NotificationsPagination } from "./NotificationsPagination";
import type { NotificationsPagePayload, NotificationView } from "./types";

const PAGE_SIZE = 6;

interface NotificationsModalProps {
  open: boolean;
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

async function fetchNotificationsPage(
  view: NotificationView,
  page: number,
): Promise<NotificationsPagePayload> {
  const response = await fetch(
    `/api/notifications?view=${view}&page=${page}&pageSize=${PAGE_SIZE}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error("Could not load notifications.");
  }
  return response.json() as Promise<NotificationsPagePayload>;
}

export function NotificationsModal({
  open,
  onClose,
  onUnreadCountChange,
}: NotificationsModalProps) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<NotificationView>("inbox");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["notifications", view, page],
    queryFn: async () => {
      const payload = await fetchNotificationsPage(view, page);
      onUnreadCountChange(payload.unreadCount);
      return payload;
    },
    enabled: open,
    retry: false,
    placeholderData: (previous) => previous,
  });

  const data = query.data;

  const mutation = useMutation({
    mutationFn: async (payload: {
      action:
        | "mark_read"
        | "mark_all_read"
        | "archive"
        | "unarchive"
        | "archive_all_read";
      notificationId?: string;
    }) => {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Could not update notification.");
      }
      return response.json() as Promise<{
        unreadCount: number;
        archivedCount: number;
      }>;
    },
    onSuccess: async (result) => {
      onUnreadCountChange(result.unreadCount);
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  function switchView(nextView: NotificationView) {
    setView(nextView);
    setPage(1);
  }

  const hasReadInboxItems =
    view === "inbox" && Boolean(data?.items.some((item) => Boolean(item.readAt)));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Notifications"
      description="Updates about your applications, reviews, and support messages."
      size="lg"
      closedBy="any"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <Link
            href="/account/settings"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ceda-burgundy hover:underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
          >
            <Settings aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Notification settings</span>
          </Link>

          {data ? (
            <NotificationsPagination
              page={data.page}
              totalPages={data.totalPages}
              totalCount={data.totalCount}
              pageSize={data.pageSize}
              disabled={query.isFetching || mutation.isPending}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      }
    >
      {/* View Tabs & Bulk Actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-ceda-line pb-3">
        <div
          role="tablist"
          aria-label="Notification folders"
          className="inline-flex rounded-full border border-ceda-line bg-neutral-100 p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === "inbox"}
            onClick={() => switchView("inbox")}
            className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange ${
              view === "inbox"
                ? "bg-white text-ceda-burgundy shadow-xs"
                : "text-ceda-muted hover:text-ceda-ink"
            }`}
          >
            <span>Inbox</span>
            {data && data.unreadCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-ceda-burgundy px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
                {data.unreadCount > 99 ? "99+" : data.unreadCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={view === "archived"}
            onClick={() => switchView("archived")}
            className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange ${
              view === "archived"
                ? "bg-white text-ceda-burgundy shadow-xs"
                : "text-ceda-muted hover:text-ceda-ink"
            }`}
          >
            <span>Archived</span>
            {data && data.archivedCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-neutral-700">
                {data.archivedCount}
              </span>
            ) : null}
          </button>
        </div>

        {view === "inbox" ? (
          <div className="flex flex-wrap items-center gap-2">
            {data && data.unreadCount > 0 ? (
              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ action: "mark_all_read" })}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-ceda-line bg-white px-3.5 text-xs font-semibold text-ceda-burgundy transition hover:bg-ceda-cream disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
              >
                <CheckCheck aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            ) : null}
            {hasReadInboxItems ? (
              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ action: "archive_all_read" })}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-ceda-line bg-white px-3.5 text-xs font-semibold text-ceda-muted transition hover:bg-ceda-cream hover:text-ceda-burgundy disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
              >
                <Archive aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Archive read</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Content States */}
      {query.isLoading && !data ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading notifications">
          <Skeleton variant="rect" className="h-24 rounded-xl" />
          <Skeleton variant="rect" className="h-24 rounded-xl" />
          <Skeleton variant="rect" className="h-24 rounded-xl" />
        </div>
      ) : query.isError ? (
        <div
          role="alert"
          className="flex flex-col items-start justify-between gap-3 rounded-xl border border-red-800/20 bg-red-50 p-4 text-sm text-red-900 sm:flex-row sm:items-center"
        >
          <span>
            We could not load your notifications right now. Please try again.
          </span>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-red-800/25 bg-white px-3.5 text-xs font-semibold text-red-900 transition hover:bg-red-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
          >
            Try again
          </button>
        </div>
      ) : data && data.items.length > 0 ? (
        <ol className="space-y-3">
          {data.items.map((item) => (
            <NotificationRow
              key={item.id}
              item={item}
              view={view}
              disabled={mutation.isPending}
              onMarkRead={(id) =>
                mutation.mutate({ action: "mark_read", notificationId: id })
              }
              onArchive={(id) =>
                mutation.mutate({ action: "archive", notificationId: id })
              }
              onUnarchive={(id) =>
                mutation.mutate({ action: "unarchive", notificationId: id })
              }
            />
          ))}
        </ol>
      ) : (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-400 shadow-xs"
          >
            {view === "archived" ? (
              <Archive className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
          </span>
          <p className="mt-3 text-sm font-semibold text-ceda-ink">
            {view === "archived"
              ? "No archived notifications"
              : "No notifications yet"}
          </p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-ceda-muted">
            {view === "archived"
              ? "Notifications you archive from your inbox will show up here."
              : "Updates about your applications, reviews, and support messages will show up here."}
          </p>
        </div>
      )}
    </Dialog>
  );
}
