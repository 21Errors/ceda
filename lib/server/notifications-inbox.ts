import "server-only";

import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export type NotificationView = "inbox" | "archived";

export type NotificationMutationAction =
  | "mark_read"
  | "mark_all_read"
  | "archive"
  | "unarchive"
  | "archive_all_read";

let archiveColumnPromise: Promise<void> | null = null;

// Use explicit SQL references for archived_at so queries remain resilient even
// before a running dev server reloads a newly added column in db/schema.ts.
const isArchivedSql = sql`"notifications"."archived_at" IS NOT NULL`;
const isNotArchivedSql = sql`"notifications"."archived_at" IS NULL`;
const archivedAtColSql = sql<Date | string | null>`"notifications"."archived_at"`;

function toIsoOrNull(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export async function ensureNotificationArchiveColumn() {
  if (!archiveColumnPromise) {
    archiveColumnPromise = db
      .execute(
        sql`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone`,
      )
      .then(() => undefined)
      .catch((error) => {
        archiveColumnPromise = null;
        throw error;
      });
  }
  await archiveColumnPromise;
}

export async function getNotificationCounts(userId: string) {
  await ensureNotificationArchiveColumn();
  const [unreadRow, archivedRow] = await Promise.all([
    db
      .select({ total: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          isNull(notifications.readAt),
          isNotArchivedSql,
        ),
      ),
    db
      .select({ total: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isArchivedSql)),
  ]);

  return {
    unreadCount: Number(unreadRow[0]?.total ?? 0),
    archivedCount: Number(archivedRow[0]?.total ?? 0),
  };
}

export async function listUserNotifications({
  userId,
  view,
  page,
  pageSize,
}: {
  userId: string;
  view: NotificationView;
  page: number;
  pageSize: number;
}) {
  await ensureNotificationArchiveColumn();

  const safePageSize = Math.min(Math.max(pageSize, 1), 25);
  const viewCondition =
    view === "archived"
      ? and(eq(notifications.userId, userId), isArchivedSql)
      : and(eq(notifications.userId, userId), isNotArchivedSql);

  const [totalRow, counts] = await Promise.all([
    db.select({ total: count() }).from(notifications).where(viewCondition),
    getNotificationCounts(userId),
  ]);

  const totalCount = Number(totalRow[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const offset = (safePage - 1) * safePageSize;

  const rows = await db
    .select({
      id: notifications.id,
      ideaId: notifications.ideaId,
      type: notifications.type,
      title: notifications.title,
      body: notifications.body,
      readAt: notifications.readAt,
      archivedAt: archivedAtColSql,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(viewCondition)
    .orderBy(desc(notifications.createdAt))
    .limit(safePageSize)
    .offset(offset);

  return {
    items: rows.map((row) => ({
      ...row,
      readAt: toIsoOrNull(row.readAt),
      archivedAt: toIsoOrNull(row.archivedAt),
      createdAt: toIsoOrNull(row.createdAt) ?? new Date().toISOString(),
    })),
    view,
    page: safePage,
    pageSize: safePageSize,
    totalCount,
    totalPages,
    unreadCount: counts.unreadCount,
    archivedCount: counts.archivedCount,
  };
}

const UUID_REGEX = /^[\da-f-]{36}$/i;

export async function mutateUserNotifications({
  userId,
  action,
  notificationId,
}: {
  userId: string;
  action: NotificationMutationAction;
  notificationId?: string;
}) {
  await ensureNotificationArchiveColumn();
  const now = new Date();

  if (action === "mark_all_read") {
    await db
      .update(notifications)
      .set({ readAt: now })
      .where(
        and(
          eq(notifications.userId, userId),
          isNull(notifications.readAt),
          isNotArchivedSql,
        ),
      );
  } else if (action === "archive_all_read") {
    await db.execute(
      sql`UPDATE "notifications" SET "archived_at" = NOW() WHERE "user_id" = ${userId} AND "read_at" IS NOT NULL AND "archived_at" IS NULL`,
    );
  } else {
    if (!notificationId || !UUID_REGEX.test(notificationId)) {
      return { ok: false as const, error: "Notification not found." };
    }

    if (action === "mark_read") {
      await db
        .update(notifications)
        .set({ readAt: now })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId),
            isNull(notifications.readAt),
          ),
        );
    } else if (action === "archive") {
      await db.execute(
        sql`UPDATE "notifications" SET "archived_at" = NOW(), "read_at" = COALESCE("read_at", NOW()) WHERE "id" = ${notificationId} AND "user_id" = ${userId}`,
      );
    } else if (action === "unarchive") {
      await db.execute(
        sql`UPDATE "notifications" SET "archived_at" = NULL WHERE "id" = ${notificationId} AND "user_id" = ${userId}`,
      );
    }
  }

  const counts = await getNotificationCounts(userId);
  return { ok: true as const, ...counts };
}
