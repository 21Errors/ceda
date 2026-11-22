"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { ideaSubscriptions, ideas } from "@/db/schema";
import { getUserRoles, requireUser } from "@/lib/authorization";
import { writeAudit } from "@/lib/server/audit";
import { canAccessTrackedIdea } from "@/lib/server/track-submission";
import { normalizeReferenceInput } from "@/lib/track-pipeline";

const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export async function toggleTrackedIdeaAlert(formData: FormData) {
  const rawRef = String(formData.get("referenceNo") ?? "");
  const referenceNo = normalizeReferenceInput(rawRef);
  const returnPath = referenceNo
    ? `/track?ref=${encodeURIComponent(referenceNo)}`
    : "/track";

  const user = await requireUser(returnPath);
  const ideaId = String(formData.get("ideaId") ?? "");
  const follow = formData.get("follow") === "true";

  if (!uuidPattern.test(ideaId)) {
    redirect(`${returnPath}${referenceNo ? "&" : "?"}error=invalid`);
  }

  const [roles, [idea]] = await Promise.all([
    getUserRoles(user.id),
    db
      .select({
        id: ideas.id,
        referenceNo: ideas.referenceNo,
        submitterId: ideas.submitterId,
        status: ideas.status,
      })
      .from(ideas)
      .where(eq(ideas.id, ideaId))
      .limit(1),
  ]);

  if (
    !idea ||
    !canAccessTrackedIdea(idea, user.id, roles) ||
    idea.status === "draft" ||
    idea.status === "withdrawn"
  ) {
    redirect(`${returnPath}${referenceNo ? "&" : "?"}error=unavailable`);
  }

  await db.transaction(async (tx) => {
    if (follow) {
      await tx
        .insert(ideaSubscriptions)
        .values({ userId: user.id, ideaId: idea.id })
        .onConflictDoNothing();
    } else {
      await tx
        .delete(ideaSubscriptions)
        .where(
          and(
            eq(ideaSubscriptions.userId, user.id),
            eq(ideaSubscriptions.ideaId, idea.id),
          ),
        );
    }

    await writeAudit(tx, {
      actorId: user.id,
      action: follow ? "idea.followed" : "idea.unfollowed",
      entityType: "idea",
      entityId: idea.id,
      metadata: { source: "track_page", referenceNo: idea.referenceNo },
    });
  });

  revalidatePath("/track");
  revalidatePath("/committee");
  redirect(
    `/track?ref=${encodeURIComponent(idea.referenceNo)}&alert=${follow ? "followed" : "unfollowed"}`,
  );
}
