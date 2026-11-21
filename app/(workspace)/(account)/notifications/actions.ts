"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireUser } from "@/lib/authorization";

export async function markAllNotificationsRead() {
  const account = await requireUser("/notifications");
  await db.update(notifications).set({ readAt: new Date() })
    .where(and(eq(notifications.userId, account.id), isNull(notifications.readAt)));
  revalidatePath("/notifications");
}
