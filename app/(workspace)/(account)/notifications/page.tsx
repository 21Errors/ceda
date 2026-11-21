import { desc, eq } from "drizzle-orm";
import { Suspense } from "react";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireUser } from "@/lib/authorization";
import { markAllNotificationsRead } from "@/app/(workspace)/(account)/notifications/actions";

export default function NotificationsPage() {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="list" />}>
      <NotificationsContent />
    </Suspense>
  );
}

async function NotificationsContent() {
  const account = await requireUser("/notifications");
  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, account.id))
    .orderBy(desc(notifications.createdAt))
    .limit(100);
  const unread = items.some((item) => !item.readAt);
  return (
    <main
      id="main-content"
      className="flex-1 bg-[#FFFDFC] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-ceda-burgundy">
              Your account
            </p>
            <h1 className="mt-2 text-3xl font-bold text-ceda-ink">
              Notifications
            </h1>
            <p className="mt-2 text-sm text-ceda-muted">
              Submission progress, reviews, and consultant chat updates.
            </p>
          </div>
          {unread && (
            <form action={markAllNotificationsRead}>
              <button
                type="submit"
                className="inline-flex min-h-11 w-fit items-center rounded-full border border-ceda-line px-5 text-sm font-semibold text-ceda-burgundy hover:bg-white">
                Mark all as read
              </button>
            </form>
          )}
        </header>
        {items.length ? (
          <ol className="mt-7 space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className={`rounded-2xl border p-5 ${item.readAt ? "border-ceda-line bg-white" : "border-ceda-burgundy/30 bg-[#FFF9F4]"}`}>
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.readAt ? "bg-transparent" : "bg-ceda-burgundy"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-ceda-ink">{item.title}</h2>
                    {item.body && (
                      <p className="mt-1 wrap-break-word text-sm leading-6 text-ceda-muted">
                        {item.body}
                      </p>
                    )}
                    <time
                      className="mt-3 block text-xs text-ceda-muted"
                      dateTime={item.createdAt.toISOString()}>
                      {new Intl.DateTimeFormat("en-BW", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Africa/Gaborone",
                      }).format(item.createdAt)}
                    </time>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-7 rounded-2xl bg-white p-6 text-sm text-ceda-muted">
            You have no notifications yet.
          </p>
        )}
      </div>
    </main>
  );
}
