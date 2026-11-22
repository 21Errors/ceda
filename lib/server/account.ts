import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notificationPreferences, userProfiles } from "@/db/schema";

export interface NotificationChannelState {
  in_app: boolean;
  email: boolean;
  sms: boolean;
}

export async function loadUserNotificationPreferences(
  userId: string,
): Promise<NotificationChannelState> {
  const preferences = await db
    .select({
      channel: notificationPreferences.channel,
      enabled: notificationPreferences.enabled,
    })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));

  return {
    in_app:
      preferences.find(({ channel }) => channel === "in_app")?.enabled ?? true,
    email:
      preferences.find(({ channel }) => channel === "email")?.enabled ?? true,
    sms:
      preferences.find(({ channel }) => channel === "sms")?.enabled ?? false,
  };
}

export async function loadUserProfileDetails(userId: string) {
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  return profile ?? null;
}
