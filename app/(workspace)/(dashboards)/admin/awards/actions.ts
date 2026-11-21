"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { awards, ideaStageHistory, ideas, workflowStages } from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import { writeAudit } from "@/lib/server/audit";
import { notifyIdeaFollowers } from "@/lib/server/idea-alerts";
import { dispatchNotificationEmails, insertInAppNotifications } from "@/lib/server/notifications";

const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export async function grantAward(formData: FormData) {
  const admin = await requireRole("admin", "/admin/awards");
  const ideaId = String(formData.get("ideaId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const tierInput = String(formData.get("tier") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!uuidPattern.test(ideaId) || title.length < 3 || title.length > 255 || tierInput.length > 50 || description.length > 2000) redirect("/admin/awards?error=invalid");

  const [idea] = await db.select({ id: ideas.id, referenceNo: ideas.referenceNo, callId: ideas.callId, submitterId: ideas.submitterId, currentStageId: ideas.currentStageId })
    .from(ideas).where(and(eq(ideas.id, ideaId), eq(ideas.status, "approved"))).limit(1);
  if (!idea) redirect("/admin/awards?error=unavailable");
  const [awardStage] = await db.select({ id: workflowStages.id })
    .from(workflowStages).where(and(eq(workflowStages.callId, idea.callId), eq(workflowStages.type, "award"))).limit(1);
  if (!awardStage) redirect("/admin/awards?error=configuration");
  const notificationEvent = { userId: idea.submitterId, ideaId: idea.id, type: "award_granted", title: "Your idea received an award", body: `${idea.referenceNo} has received ${title}${tierInput ? ` (${tierInput})` : ""}.` };

  await db.transaction(async (tx) => {
    const [updated] = await tx.update(ideas)
      .set({ status: "awarded", currentStageId: awardStage.id })
      .where(and(eq(ideas.id, idea.id), eq(ideas.status, "approved")))
      .returning({ id: ideas.id });
    if (!updated) throw new Error("This submission has already changed or received an award.");

    await tx.insert(awards).values({
      ideaId: idea.id,
      title,
      tier: tierInput || null,
      description: description || null,
      awardedBy: admin.id,
    });
    await tx.insert(ideaStageHistory).values({
      ideaId: idea.id,
      fromStageId: idea.currentStageId,
      toStageId: awardStage.id,
      toStatus: "awarded",
      actorId: admin.id,
      note: `Award granted: ${title}${tierInput ? ` (${tierInput})` : ""}.`,
    });
    await insertInAppNotifications(tx, [notificationEvent]);
    await notifyIdeaFollowers(tx, {
      ideaId: idea.id,
      actorId: admin.id,
      excludeUserIds: [idea.submitterId],
      type: "award_granted",
      title: "An award was granted",
      body: `Submission ${idea.referenceNo} received ${title}${tierInput ? ` (${tierInput})` : ""}.`,
    });
    await writeAudit(tx, {
      actorId: admin.id,
      action: "award.granted",
      entityType: "idea",
      entityId: idea.id,
      metadata: { referenceNo: idea.referenceNo, title, tier: tierInput || null },
    });
  });
  await dispatchNotificationEmails([notificationEvent]);

  revalidatePath("/admin/awards");
  revalidatePath("/admin/reports");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/submissions/${idea.id}`);
}
