"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { ideaSubscriptions, ideas } from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import { writeAudit } from "@/lib/server/audit";

const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export async function toggleIdeaFollow(formData: FormData) {
  const user = await requireRole("committee_member", "/committee");
  const ideaId = String(formData.get("ideaId") ?? "");
  const follow = formData.get("follow") === "true";
  if (!uuidPattern.test(ideaId)) redirect("/committee?error=invalid");

  const [idea] = await db.select({ id: ideas.id, status: ideas.status })
    .from(ideas).where(eq(ideas.id, ideaId)).limit(1);
  if (!idea || idea.status === "draft" || idea.status === "withdrawn") redirect("/committee?error=unavailable");

  await db.transaction(async (tx) => {
    if (follow) {
      await tx.insert(ideaSubscriptions).values({ userId: user.id, ideaId }).onConflictDoNothing();
    } else {
      await tx.delete(ideaSubscriptions).where(and(
        eq(ideaSubscriptions.userId, user.id),
        eq(ideaSubscriptions.ideaId, ideaId),
      ));
    }
    await writeAudit(tx, {
      actorId: user.id,
      action: follow ? "idea.followed" : "idea.unfollowed",
      entityType: "idea",
      entityId: ideaId,
      metadata: { source: "committee_workspace" },
    });
  });
  revalidatePath("/committee");
}
