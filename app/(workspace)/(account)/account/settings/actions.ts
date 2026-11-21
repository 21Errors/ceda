"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { notificationPreferences } from "@/db/schema";
import { requireUser } from "@/lib/authorization";
import { writeAudit } from "@/lib/server/audit";

const channels = ["in_app", "email", "sms"] as const;

export async function saveNotificationPreferences(formData: FormData) {
  const currentUser = await requireUser("/account/settings");
  const enabled: Record<(typeof channels)[number], boolean> = {
    in_app: formData.get("in_app") === "on",
    email: formData.get("email") === "on",
    sms: formData.get("sms") === "on",
  };

  await db.transaction(async (tx) => {
    for (const channel of channels) {
      await tx.insert(notificationPreferences).values({ userId: currentUser.id, channel, enabled: enabled[channel] })
        .onConflictDoUpdate({ target: [notificationPreferences.userId, notificationPreferences.channel], set: { enabled: enabled[channel] } });
    }
    await writeAudit(tx, {
      actorId: currentUser.id,
      action: "notification_preferences.updated",
      entityType: "user",
      entityId: currentUser.id,
      metadata: enabled,
    });
  });

  redirect("/account/settings?saved=notifications");
}
