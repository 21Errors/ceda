"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userProfiles, user } from "@/db/schema";
import { requireUser } from "@/lib/authorization";
import { writeAudit } from "@/lib/server/audit";

export type ProfileState = { error?: string; success?: string };

export async function updateProfile(_previous: ProfileState, formData: FormData): Promise<ProfileState> {
  const currentUser = await requireUser("/profile");
  const name = String(formData.get("name") ?? "").trim();
  const organisation = String(formData.get("organisation") ?? "").trim();
  const jobTitle = String(formData.get("jobTitle") ?? "").trim();
  if (name.length < 2 || name.length > 120) return { error: "Enter a name between 2 and 120 characters." };
  if (organisation.length > 255 || jobTitle.length > 150) return { error: "Organisation or job title is too long." };

  await db.transaction(async (tx) => {
    await tx.update(user).set({ name }).where(eqUser(currentUser.id));
    await tx.insert(userProfiles).values({ userId: currentUser.id, organisation: organisation || null, jobTitle: jobTitle || null })
      .onConflictDoUpdate({ target: userProfiles.userId, set: { organisation: organisation || null, jobTitle: jobTitle || null, updatedAt: new Date() } });
    await writeAudit(tx, { actorId: currentUser.id, action: "profile.updated", entityType: "user", entityId: currentUser.id, metadata: { organisationUpdated: true, jobTitleUpdated: true } });
  });
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: "Profile updated." };
}

function eqUser(id: string) {
  return eq(user.id, id);
}

